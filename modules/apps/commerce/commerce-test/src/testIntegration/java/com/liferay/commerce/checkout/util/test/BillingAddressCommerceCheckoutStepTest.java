/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.commerce.checkout.util.test;

import com.liferay.account.constants.AccountRoleConstants;
import com.liferay.account.model.AccountEntry;
import com.liferay.account.service.AccountEntryUserRelLocalService;
import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.commerce.account.test.util.CommerceAccountTestUtil;
import com.liferay.commerce.constants.CommerceCheckoutWebKeys;
import com.liferay.commerce.constants.CommerceOrderActionKeys;
import com.liferay.commerce.constants.CommerceOrderConstants;
import com.liferay.commerce.currency.model.CommerceCurrency;
import com.liferay.commerce.currency.test.util.CommerceCurrencyTestUtil;
import com.liferay.commerce.model.CommerceOrder;
import com.liferay.commerce.product.constants.CommerceChannelAccountEntryRelConstants;
import com.liferay.commerce.product.model.CommerceChannel;
import com.liferay.commerce.product.service.CommerceChannelAccountEntryRelLocalService;
import com.liferay.commerce.service.CommerceOrderLocalService;
import com.liferay.commerce.test.util.CommerceInventoryTestUtil;
import com.liferay.commerce.test.util.CommerceTestUtil;
import com.liferay.commerce.util.CommerceCheckoutStep;
import com.liferay.portal.kernel.model.Address;
import com.liferay.portal.kernel.model.Country;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.GroupConstants;
import com.liferay.portal.kernel.model.Region;
import com.liferay.portal.kernel.model.ResourceConstants;
import com.liferay.portal.kernel.model.Role;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.security.permission.PermissionCheckerFactoryUtil;
import com.liferay.portal.kernel.service.AddressLocalService;
import com.liferay.portal.kernel.service.ResourcePermissionLocalService;
import com.liferay.portal.kernel.service.RoleLocalService;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.UserGroupRoleLocalService;
import com.liferay.portal.kernel.test.rule.AggregateTestRule;
import com.liferay.portal.kernel.test.rule.DeleteAfterTestRun;
import com.liferay.portal.kernel.test.rule.Sync;
import com.liferay.portal.kernel.test.util.GroupTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.test.util.ServiceContextTestUtil;
import com.liferay.portal.kernel.test.util.UserTestUtil;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.test.rule.Inject;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;
import com.liferay.portal.test.rule.PermissionCheckerMethodTestRule;
import com.liferay.portal.theme.ThemeDisplayFactory;

import jakarta.servlet.http.HttpServletRequest;

import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import org.springframework.mock.web.MockHttpServletRequest;

/**
 * @author Crescenzo Rega
 */
@RunWith(Arquillian.class)
@Sync
public class BillingAddressCommerceCheckoutStepTest {

	@ClassRule
	@Rule
	public static AggregateTestRule aggregateTestRule = new AggregateTestRule(
		new LiferayIntegrationTestRule(),
		PermissionCheckerMethodTestRule.INSTANCE);

	@Before
	public void setUp() throws Exception {
		_group = GroupTestUtil.addGroup();

		_commerceCurrency = CommerceCurrencyTestUtil.addCommerceCurrency(
			_group.getCompanyId());

		_commerceChannel = CommerceTestUtil.addCommerceChannel(
			_group.getGroupId(), _commerceCurrency.getCode());

		_serviceContext = ServiceContextTestUtil.getServiceContext(
			_group.getGroupId());

		_user = UserTestUtil.addUser();

		_accountEntry = CommerceAccountTestUtil.addBusinessAccountEntry(
			_user.getUserId(), RandomTestUtil.randomString(),
			RandomTestUtil.randomString() + "@liferay.com",
			RandomTestUtil.randomString(), new long[] {_user.getUserId()}, null,
			_serviceContext);

		_buyerRole = _roleLocalService.getRole(
			_group.getCompanyId(),
			AccountRoleConstants.ROLE_NAME_ACCOUNT_BUYER);

		_buyerUser = _addBuyerUser(_buyerRole);
	}

	@Test
	public void testBillingAddressIsNotVisibleToBuyerUserWithoutPermission()
		throws Exception {

		Assert.assertTrue(
			_resourcePermissionLocalService.hasResourcePermission(
				_group.getCompanyId(), CommerceOrderConstants.RESOURCE_NAME,
				ResourceConstants.SCOPE_GROUP_TEMPLATE,
				String.valueOf(GroupConstants.DEFAULT_PARENT_GROUP_ID),
				_buyerRole.getRoleId(),
				CommerceOrderActionKeys.VIEW_BILLING_ADDRESS));

		_resourcePermissionLocalService.removeResourcePermission(
			_group.getCompanyId(), CommerceOrderConstants.RESOURCE_NAME,
			ResourceConstants.SCOPE_GROUP_TEMPLATE,
			String.valueOf(GroupConstants.DEFAULT_PARENT_GROUP_ID),
			_buyerRole.getRoleId(),
			CommerceOrderActionKeys.VIEW_BILLING_ADDRESS);

		Assert.assertFalse(
			_resourcePermissionLocalService.hasResourcePermission(
				_group.getCompanyId(), CommerceOrderConstants.RESOURCE_NAME,
				ResourceConstants.SCOPE_GROUP_TEMPLATE,
				String.valueOf(GroupConstants.DEFAULT_PARENT_GROUP_ID),
				_buyerRole.getRoleId(),
				CommerceOrderActionKeys.VIEW_BILLING_ADDRESS));

		boolean activeBillingAddressCommerceCheckoutStep =
			_isBillingAddressCommerceCheckoutStepActive();

		Assert.assertFalse(activeBillingAddressCommerceCheckoutStep);

		_resourcePermissionLocalService.addResourcePermission(
			_group.getCompanyId(), CommerceOrderConstants.RESOURCE_NAME,
			ResourceConstants.SCOPE_GROUP_TEMPLATE,
			String.valueOf(GroupConstants.DEFAULT_PARENT_GROUP_ID),
			_buyerRole.getRoleId(),
			CommerceOrderActionKeys.VIEW_BILLING_ADDRESS);

		Assert.assertTrue(
			_resourcePermissionLocalService.hasResourcePermission(
				_group.getCompanyId(), CommerceOrderConstants.RESOURCE_NAME,
				ResourceConstants.SCOPE_GROUP_TEMPLATE,
				String.valueOf(GroupConstants.DEFAULT_PARENT_GROUP_ID),
				_buyerRole.getRoleId(),
				CommerceOrderActionKeys.VIEW_BILLING_ADDRESS));
	}

	@Test
	public void testBillingAddressIsVisibleToBuyerUserWithPermission()
		throws Exception {

		boolean activeBillingAddressCommerceCheckoutStep =
			_isBillingAddressCommerceCheckoutStepActive();

		Assert.assertTrue(activeBillingAddressCommerceCheckoutStep);
	}

	private User _addBuyerUser(Role buyerRole) throws Exception {
		User buyerUser = UserTestUtil.addUser(_group.getGroupId());

		_accountEntryUserRelLocalService.addAccountEntryUserRel(
			_accountEntry.getAccountEntryId(), buyerUser.getUserId());

		_userGroupRoleLocalService.addUserGroupRole(
			buyerUser.getUserId(), _accountEntry.getAccountEntryGroupId(),
			buyerRole.getRoleId());

		return buyerUser;
	}

	private boolean _isBillingAddressCommerceCheckoutStepActive()
		throws Exception {

		CommerceOrder commerceOrder =
			_commerceOrderLocalService.addCommerceOrder(
				_buyerUser.getUserId(), _commerceChannel.getGroupId(),
				_accountEntry.getAccountEntryId(), _commerceCurrency.getCode(),
				0);

		Country country = CommerceInventoryTestUtil.addCountry(_serviceContext);

		Region region = CommerceInventoryTestUtil.addRegion(
			country.getCountryId(), _serviceContext);

		Address address = _addressLocalService.addAddress(
			RandomTestUtil.randomString(), _user.getUserId(),
			AccountEntry.class.getName(), _accountEntry.getAccountEntryId(),
			country.getCountryId(), 0, region.getRegionId(),
			RandomTestUtil.randomString(), RandomTestUtil.randomString(), false,
			RandomTestUtil.randomString(), true, RandomTestUtil.randomString(),
			RandomTestUtil.randomString(), RandomTestUtil.randomString(), null,
			RandomTestUtil.randomString(), RandomTestUtil.randomString(),
			_serviceContext);

		commerceOrder.setShippingAddressId(address.getAddressId());

		commerceOrder = _commerceOrderLocalService.updateCommerceOrder(
			commerceOrder);

		_commerceChannelAccountEntryRelLocalService.
			addCommerceChannelAccountEntryRel(
				_user.getUserId(), _accountEntry.getAccountEntryId(),
				Address.class.getName(), address.getAddressId(),
				_commerceChannel.getCommerceChannelId(), true, 0,
				CommerceChannelAccountEntryRelConstants.TYPE_BILLING_ADDRESS);

		HttpServletRequest httpServletRequest = new MockHttpServletRequest();

		httpServletRequest.setAttribute(
			CommerceCheckoutWebKeys.COMMERCE_ORDER, commerceOrder);

		ThemeDisplay themeDisplay = ThemeDisplayFactory.create();

		themeDisplay.setPermissionChecker(
			PermissionCheckerFactoryUtil.create(_buyerUser));
		themeDisplay.setScopeGroupId(_group.getGroupId());
		themeDisplay.setSignedIn(true);
		themeDisplay.setUser(_buyerUser);

		httpServletRequest.setAttribute(WebKeys.THEME_DISPLAY, themeDisplay);

		return _commerceCheckoutStep.isActive(httpServletRequest, null);
	}

	private AccountEntry _accountEntry;

	@Inject
	private AccountEntryUserRelLocalService _accountEntryUserRelLocalService;

	@Inject
	private AddressLocalService _addressLocalService;

	private Role _buyerRole;
	private User _buyerUser;

	@DeleteAfterTestRun
	private CommerceChannel _commerceChannel;

	@Inject
	private CommerceChannelAccountEntryRelLocalService
		_commerceChannelAccountEntryRelLocalService;

	@Inject(
		filter = "component.name=com.liferay.commerce.checkout.web.internal.util.BillingAddressCommerceCheckoutStep"
	)
	private CommerceCheckoutStep _commerceCheckoutStep;

	private CommerceCurrency _commerceCurrency;

	@Inject
	private CommerceOrderLocalService _commerceOrderLocalService;

	private Group _group;

	@Inject
	private ResourcePermissionLocalService _resourcePermissionLocalService;

	@Inject
	private RoleLocalService _roleLocalService;

	private ServiceContext _serviceContext;
	private User _user;

	@Inject
	private UserGroupRoleLocalService _userGroupRoleLocalService;

}