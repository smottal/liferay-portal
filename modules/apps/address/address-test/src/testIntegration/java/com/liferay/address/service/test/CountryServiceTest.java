/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.address.service.test;

import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.portal.kernel.model.Country;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.ResourceConstants;
import com.liferay.portal.kernel.model.Role;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.model.role.RoleConstants;
import com.liferay.portal.kernel.security.auth.PrincipalException;
import com.liferay.portal.kernel.security.permission.ActionKeys;
import com.liferay.portal.kernel.security.permission.PermissionCheckerFactoryUtil;
import com.liferay.portal.kernel.security.permission.PermissionThreadLocal;
import com.liferay.portal.kernel.service.CountryLocalService;
import com.liferay.portal.kernel.service.CountryService;
import com.liferay.portal.kernel.service.ResourcePermissionLocalService;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.test.rule.DeleteAfterTestRun;
import com.liferay.portal.kernel.test.util.GroupTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.test.util.RoleTestUtil;
import com.liferay.portal.kernel.test.util.ServiceContextTestUtil;
import com.liferay.portal.kernel.test.util.UserTestUtil;
import com.liferay.portal.kernel.util.PortletKeys;
import com.liferay.portal.test.rule.Inject;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;

import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * @author Tancredi Covioli
 */
@RunWith(Arquillian.class)
public class CountryServiceTest {

	@ClassRule
	@Rule
	public static final LiferayIntegrationTestRule liferayIntegrationTestRule =
		new LiferayIntegrationTestRule();

	@Before
	public void setUp() throws Exception {
		_user = UserTestUtil.addUser();

		PermissionThreadLocal.setPermissionChecker(
			PermissionCheckerFactoryUtil.create(_user));

		_group = GroupTestUtil.addGroup();

		_serviceContext = ServiceContextTestUtil.getServiceContext(
			_group.getCompanyId(), _group.getGroupId(), _user.getUserId());

		_role = RoleTestUtil.addRole(RoleConstants.TYPE_REGULAR);

		_userLocalService.addRoleUser(_role.getRoleId(), _user);
	}

	@Test
	public void testAddCountry() throws Exception {
		try {
			_country = _countryService.addCountry(
				"aa", "aaa", true, RandomTestUtil.randomBoolean(),
				RandomTestUtil.randomString(), RandomTestUtil.randomString(),
				RandomTestUtil.randomString(), RandomTestUtil.randomDouble(),
				RandomTestUtil.randomBoolean(), RandomTestUtil.randomBoolean(),
				RandomTestUtil.randomBoolean(),
				ServiceContextTestUtil.getServiceContext());

			Assert.fail();
		}
		catch (PrincipalException.MustHavePermission principalException) {
			Assert.assertNotNull(principalException);
		}

		_resourcePermissionLocalService.addResourcePermission(
			_serviceContext.getCompanyId(), PortletKeys.PORTAL,
			ResourceConstants.SCOPE_COMPANY,
			String.valueOf(_serviceContext.getCompanyId()), _role.getRoleId(),
			ActionKeys.ADD_COUNTRY);

		_country = _countryService.addCountry(
			"aa", "aaa", true, RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomString(), RandomTestUtil.randomString(),
			RandomTestUtil.randomString(), RandomTestUtil.randomDouble(),
			RandomTestUtil.randomBoolean(), RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomBoolean(),
			ServiceContextTestUtil.getServiceContext());

		_country = _countryLocalService.fetchCountry(_country.getCountryId());

		Assert.assertNotNull(_country);
	}

	@Test
	public void testDeleteCountry() throws Exception {
		_country = _countryLocalService.addCountry(
			"aa", "aaa", true, RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomString(), RandomTestUtil.randomString(),
			RandomTestUtil.randomString(), RandomTestUtil.randomDouble(),
			RandomTestUtil.randomBoolean(), RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomBoolean(),
			ServiceContextTestUtil.getServiceContext());

		try {
			_countryService.deleteCountry(_country.getCountryId());
			Assert.fail();
		}
		catch (PrincipalException.MustHavePermission principalException) {
			Assert.assertNotNull(principalException);
		}

		_resourcePermissionLocalService.addResourcePermission(
			_serviceContext.getCompanyId(), Country.class.getName(),
			ResourceConstants.SCOPE_COMPANY,
			String.valueOf(_serviceContext.getCompanyId()), _role.getRoleId(),
			ActionKeys.DELETE);

		_countryService.deleteCountry(_country.getCountryId());

		_country = _countryLocalService.fetchCountry(_country.getCountryId());

		Assert.assertNull(_country);
	}

	@Test
	public void testUpdateActive() throws Exception {
		_country = _countryLocalService.addCountry(
			"aa", "aaa", true, RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomString(), RandomTestUtil.randomString(),
			RandomTestUtil.randomString(), RandomTestUtil.randomDouble(),
			RandomTestUtil.randomBoolean(), RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomBoolean(),
			ServiceContextTestUtil.getServiceContext());

		try {
			_countryService.updateActive(_country.getCountryId(), false);
			Assert.fail();
		}
		catch (PrincipalException.MustHavePermission principalException) {
			Assert.assertNotNull(principalException);
		}

		_resourcePermissionLocalService.addResourcePermission(
			_serviceContext.getCompanyId(), Country.class.getName(),
			ResourceConstants.SCOPE_COMPANY,
			String.valueOf(_serviceContext.getCompanyId()), _role.getRoleId(),
			ActionKeys.UPDATE);

		_countryService.updateActive(country.getCountryId(), false);

		country = _countryLocalService.fetchCountry(country.getCountryId());

		Assert.assertFalse(country.isActive());
	}

	@Test
	public void testUpdateCountry() throws Exception {
		_country = _countryLocalService.addCountry(
			"aa", "aaa", true, RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomString(), RandomTestUtil.randomString(),
			RandomTestUtil.randomString(), RandomTestUtil.randomDouble(),
			RandomTestUtil.randomBoolean(), RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomBoolean(),
			ServiceContextTestUtil.getServiceContext());

		boolean active = RandomTestUtil.randomBoolean();
		boolean billingAllowed = RandomTestUtil.randomBoolean();
		String idd = RandomTestUtil.randomString();
		String name = RandomTestUtil.randomString();
		String number = RandomTestUtil.randomString();
		double position = RandomTestUtil.randomDouble();
		boolean shippingAllowed = RandomTestUtil.randomBoolean();
		boolean subjectToVAT = RandomTestUtil.randomBoolean();

		try {
			_countryService.updateCountry(
				country.getCountryId(), "xx", "yyy", active, billingAllowed,
				idd, name, number, position, shippingAllowed, subjectToVAT);
			Assert.fail();
		}
		catch (PrincipalException.MustHavePermission principalException) {
			Assert.assertNotNull(principalException);
		}

		_resourcePermissionLocalService.addResourcePermission(
			_serviceContext.getCompanyId(), Country.class.getName(),
			ResourceConstants.SCOPE_COMPANY,
			String.valueOf(_serviceContext.getCompanyId()), _role.getRoleId(),
			ActionKeys.UPDATE);

		_countryService.updateCountry(
			country.getCountryId(), "xx", "yyy", active, billingAllowed, idd,
			name, number, position, shippingAllowed, subjectToVAT);

		country = _countryLocalService.fetchCountry(country.getCountryId());

		Assert.assertEquals("xx", country.getA2());
		Assert.assertEquals("yyy", country.getA3());
		Assert.assertEquals(active, country.isActive());
		Assert.assertEquals(billingAllowed, country.isBillingAllowed());
		Assert.assertEquals(idd, country.getIdd());
		Assert.assertEquals(name, country.getName());
		Assert.assertEquals(number, country.getNumber());
		Assert.assertEquals(position, country.getPosition(), 0D);
		Assert.assertEquals(shippingAllowed, country.isShippingAllowed());
		Assert.assertEquals(subjectToVAT, country.isSubjectToVAT());
	}

	@Test
	public void testUpdateGroupFilterEnabled() throws Exception {
		Country country = _countryLocalService.addCountry(
			"aa", "aaa", true, RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomString(), RandomTestUtil.randomString(),
			RandomTestUtil.randomString(), RandomTestUtil.randomDouble(),
			RandomTestUtil.randomBoolean(), RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomBoolean(),
			ServiceContextTestUtil.getServiceContext());

		try {
			_countryService.updateGroupFilterEnabled(
				country.getCountryId(), true);
			Assert.fail();
		}
		catch (PrincipalException.MustHavePermission principalException) {
			Assert.assertNotNull(principalException);
		}

		_resourcePermissionLocalService.addResourcePermission(
			_serviceContext.getCompanyId(), Country.class.getName(),
			ResourceConstants.SCOPE_COMPANY,
			String.valueOf(_serviceContext.getCompanyId()), _role.getRoleId(),
			ActionKeys.UPDATE);

		_countryService.updateGroupFilterEnabled(country.getCountryId(), true);

		country = _countryLocalService.fetchCountry(country.getCountryId());

		Assert.assertTrue(country.isGroupFilterEnabled());
	}

	@Inject
	private static CountryLocalService _countryLocalService;

	@Inject
	private static CountryService _countryService;

	@Inject
	private static ResourcePermissionLocalService
		_resourcePermissionLocalService;

	@Inject
	private static UserLocalService _userLocalService;

	@DeleteAfterTestRun
	private Country _country;

	private Group _group;
	private Role _role;
	private ServiceContext _serviceContext;
	private User _user;

}