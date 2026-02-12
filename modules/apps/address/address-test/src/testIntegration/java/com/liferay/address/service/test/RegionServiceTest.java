/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.address.service.test;

import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.portal.kernel.model.Country;
import com.liferay.portal.kernel.model.Region;
import com.liferay.portal.kernel.model.ResourceConstants;
import com.liferay.portal.kernel.model.Role;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.model.role.RoleConstants;
import com.liferay.portal.kernel.security.auth.PrincipalException;
import com.liferay.portal.kernel.security.permission.ActionKeys;
import com.liferay.portal.kernel.security.permission.PermissionCheckerFactoryUtil;
import com.liferay.portal.kernel.service.CountryLocalService;
import com.liferay.portal.kernel.service.RegionService;
import com.liferay.portal.kernel.service.ResourcePermissionLocalService;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.test.context.ContextUserReplace;
import com.liferay.portal.kernel.test.rule.DeleteAfterTestRun;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.test.util.RoleTestUtil;
import com.liferay.portal.kernel.test.util.ServiceContextTestUtil;
import com.liferay.portal.kernel.test.util.TestPropsValues;
import com.liferay.portal.kernel.test.util.UserTestUtil;
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
public class RegionServiceTest {

	@ClassRule
	@Rule
	public static final LiferayIntegrationTestRule liferayIntegrationTestRule =
		new LiferayIntegrationTestRule();

	@Before
	public void setUp() throws Exception {
		_country = _countryLocalService.addCountry(
			"aa", "aaa", true, RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomString(), RandomTestUtil.randomString(),
			RandomTestUtil.randomString(), RandomTestUtil.randomDouble(),
			RandomTestUtil.randomBoolean(), RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomBoolean(),
			ServiceContextTestUtil.getServiceContext());

		_role = RoleTestUtil.addRole(RoleConstants.TYPE_REGULAR);
		_user = UserTestUtil.addUser();

		_userLocalService.addRoleUser(_role.getRoleId(), _user);
	}

	@Test
	public void testAddRegion() throws Exception {
		try (ContextUserReplace contextUserReplace = new ContextUserReplace(
				_user, PermissionCheckerFactoryUtil.create(_user))) {

			_region = _regionService.addRegion(
				_country.getCountryId(), true, RandomTestUtil.randomString(),
				RandomTestUtil.nextDouble(), "aa",
				ServiceContextTestUtil.getServiceContext());

			Assert.fail();
		}
		catch (PrincipalException.MustHavePermission principalException) {
			Assert.assertNotNull(principalException);
		}

		_resourcePermissionLocalService.addResourcePermission(
			TestPropsValues.getCompanyId(), Country.class.getName(),
			ResourceConstants.SCOPE_COMPANY,
			String.valueOf(TestPropsValues.getCompanyId()), _role.getRoleId(),
			ActionKeys.UPDATE);

		try (ContextUserReplace contextUserReplace = new ContextUserReplace(
				_user, PermissionCheckerFactoryUtil.create(_user))) {

			_region = _regionService.addRegion(
				_country.getCountryId(), true, RandomTestUtil.randomString(),
				RandomTestUtil.nextDouble(), "aa",
				ServiceContextTestUtil.getServiceContext());
		}
	}

	@Test
	public void testDeleteRegion() throws Exception {
		_region =
			_region = _regionService.addRegion(
				_country.getCountryId(), true, RandomTestUtil.randomString(),
				RandomTestUtil.nextDouble(), "aa",
				ServiceContextTestUtil.getServiceContext());

		try (ContextUserReplace contextUserReplace = new ContextUserReplace(
				_user, PermissionCheckerFactoryUtil.create(_user))) {

			_regionService.deleteRegion(_region.getRegionId());

			Assert.fail();
		}
		catch (PrincipalException.MustHavePermission principalException) {
			Assert.assertNotNull(principalException);
		}

		_resourcePermissionLocalService.addResourcePermission(
			TestPropsValues.getCompanyId(), Country.class.getName(),
			ResourceConstants.SCOPE_COMPANY,
			String.valueOf(TestPropsValues.getCompanyId()), _role.getRoleId(),
			ActionKeys.UPDATE);

		try (ContextUserReplace contextUserReplace = new ContextUserReplace(
				_user, PermissionCheckerFactoryUtil.create(_user))) {

			_regionService.deleteRegion(_region.getRegionId());
		}
	}

	@Test
	public void testUpdateActive() throws Exception {
		_region = _regionService.addRegion(
			_country.getCountryId(), true, RandomTestUtil.randomString(),
			RandomTestUtil.nextDouble(), "aa",
			ServiceContextTestUtil.getServiceContext());

		try (ContextUserReplace contextUserReplace = new ContextUserReplace(
				_user, PermissionCheckerFactoryUtil.create(_user))) {

			_regionService.updateActive(_region.getRegionId(), false);

			Assert.fail();
		}
		catch (PrincipalException.MustHavePermission principalException) {
			Assert.assertNotNull(principalException);
		}

		_resourcePermissionLocalService.addResourcePermission(
			TestPropsValues.getCompanyId(), Country.class.getName(),
			ResourceConstants.SCOPE_COMPANY,
			String.valueOf(TestPropsValues.getCompanyId()), _role.getRoleId(),
			ActionKeys.UPDATE);

		try (ContextUserReplace contextUserReplace = new ContextUserReplace(
				_user, PermissionCheckerFactoryUtil.create(_user))) {

			_regionService.updateActive(_region.getRegionId(), false);
		}
	}

	@Test
	public void testUpdateRegion() throws Exception {
		_region = _regionService.addRegion(
			_country.getCountryId(), true, RandomTestUtil.randomString(),
			RandomTestUtil.nextDouble(), "aa",
			ServiceContextTestUtil.getServiceContext());

		try (ContextUserReplace contextUserReplace = new ContextUserReplace(
				_user, PermissionCheckerFactoryUtil.create(_user))) {

			_region = _regionService.updateRegion(
				_region.getRegionId(), _region.isActive(),
				RandomTestUtil.randomString(), _region.getPosition(),
				_region.getRegionCode());

			Assert.fail();
		}
		catch (PrincipalException.MustHavePermission principalException) {
			Assert.assertNotNull(principalException);
		}

		_resourcePermissionLocalService.addResourcePermission(
			TestPropsValues.getCompanyId(), Country.class.getName(),
			ResourceConstants.SCOPE_COMPANY,
			String.valueOf(TestPropsValues.getCompanyId()), _role.getRoleId(),
			ActionKeys.UPDATE);

		try (ContextUserReplace contextUserReplace = new ContextUserReplace(
				_user, PermissionCheckerFactoryUtil.create(_user))) {

			_region = _regionService.updateRegion(
				_region.getRegionId(), _region.isActive(),
				RandomTestUtil.randomString(), _region.getPosition(),
				_region.getRegionCode());
		}
	}

	@Inject
	private static CountryLocalService _countryLocalService;

	@Inject
	private static RegionService _regionService;

	@Inject
	private static ResourcePermissionLocalService
		_resourcePermissionLocalService;

	@Inject
	private static UserLocalService _userLocalService;

	@DeleteAfterTestRun
	private Country _country;

	@DeleteAfterTestRun
	private Region _region;

	private Role _role;
	private User _user;

}