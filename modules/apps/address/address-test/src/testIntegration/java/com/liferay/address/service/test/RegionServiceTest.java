/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.address.service.test;

import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.portal.kernel.model.Country;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.Region;
import com.liferay.portal.kernel.model.ResourceConstants;
import com.liferay.portal.kernel.model.Role;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.model.role.RoleConstants;
import com.liferay.portal.kernel.security.auth.PrincipalException;
import com.liferay.portal.kernel.security.permission.ActionKeys;
import com.liferay.portal.kernel.security.permission.PermissionCheckerFactoryUtil;
import com.liferay.portal.kernel.security.permission.PermissionThreadLocal;
import com.liferay.portal.kernel.service.CountryLocalService;
import com.liferay.portal.kernel.service.RegionLocalService;
import com.liferay.portal.kernel.service.RegionService;
import com.liferay.portal.kernel.service.ResourcePermissionLocalService;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.test.rule.DataGuard;
import com.liferay.portal.kernel.test.util.GroupTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.test.util.RoleTestUtil;
import com.liferay.portal.kernel.test.util.ServiceContextTestUtil;
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
@DataGuard(scope = DataGuard.Scope.METHOD)
@RunWith(Arquillian.class)
public class RegionServiceTest {

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

		_country = _countryLocalService.addCountry(
			"aa", "aaa", true, RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomString(), RandomTestUtil.randomString(),
			RandomTestUtil.randomString(), RandomTestUtil.randomDouble(),
			RandomTestUtil.randomBoolean(), RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomBoolean(),
			ServiceContextTestUtil.getServiceContext());

		_role = RoleTestUtil.addRole(RoleConstants.TYPE_REGULAR);

		_userLocalService.addRoleUser(_role.getRoleId(), _user);
	}

	@Test
	public void testAddRegion() throws Exception {
		boolean active = RandomTestUtil.randomBoolean();
		String name = RandomTestUtil.randomString();
		double position = RandomTestUtil.randomDouble();
		String regionCode = RandomTestUtil.randomString();

		try {
			_regionService.addRegion(
				_country.getCountryId(), active, name, position, regionCode,
				_serviceContext);
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

		Region region = _regionService.addRegion(
			_country.getCountryId(), active, name, position, regionCode,
			_serviceContext);

		region = _regionLocalService.fetchRegion(region.getRegionId());

		Assert.assertNotNull(region);
	}

	@Test
	public void testDeleteRegion() throws Exception {
		Region region = _regionLocalService.addRegion(
			_country.getCountryId(), RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomString(), RandomTestUtil.randomDouble(),
			RandomTestUtil.randomString(), _serviceContext);

		try {
			_regionService.deleteRegion(region.getRegionId());
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

		_regionService.deleteRegion(region.getRegionId());

		region = _regionLocalService.fetchRegion(region.getRegionId());

		Assert.assertNull(region);
	}

	@Test
	public void testUpdateActive() throws Exception {
		Region region = _regionLocalService.addRegion(
			_country.getCountryId(), true, RandomTestUtil.randomString(),
			RandomTestUtil.randomDouble(), RandomTestUtil.randomString(),
			_serviceContext);

		try {
			_regionService.updateActive(region.getRegionId(), false);
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

		_regionService.updateActive(region.getRegionId(), false);

		region = _regionLocalService.fetchRegion(region.getRegionId());

		Assert.assertFalse(region.isActive());
	}

	@Test
	public void testUpdateRegion() throws Exception {
		Region region = _regionLocalService.addRegion(
			_country.getCountryId(), RandomTestUtil.randomBoolean(),
			RandomTestUtil.randomString(), RandomTestUtil.randomDouble(),
			RandomTestUtil.randomString(), _serviceContext);

		boolean active = RandomTestUtil.randomBoolean();
		String name = RandomTestUtil.randomString();
		double position = RandomTestUtil.randomDouble();
		String regionCode = RandomTestUtil.randomString();

		try {
			_regionService.updateRegion(
				region.getRegionId(), active, name, position, regionCode);
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

		_regionService.updateRegion(
			region.getRegionId(), active, name, position, regionCode);

		region = _regionLocalService.fetchRegion(region.getRegionId());

		Assert.assertEquals(active, region.isActive());
		Assert.assertEquals(name, region.getName());
		Assert.assertEquals(position, region.getPosition(), 0D);
		Assert.assertEquals(regionCode, region.getRegionCode());
	}

	@Inject
	private static CountryLocalService _countryLocalService;

	@Inject
	private static RegionLocalService _regionLocalService;

	@Inject
	private static RegionService _regionService;

	@Inject
	private static ResourcePermissionLocalService
		_resourcePermissionLocalService;

	@Inject
	private static UserLocalService _userLocalService;

	private Country _country;
	private Group _group;
	private Role _role;
	private ServiceContext _serviceContext;
	private User _user;

}