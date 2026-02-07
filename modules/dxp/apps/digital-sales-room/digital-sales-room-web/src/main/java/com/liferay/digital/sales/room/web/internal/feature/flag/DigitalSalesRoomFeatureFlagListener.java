/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.digital.sales.room.web.internal.feature.flag;

import com.liferay.digital.sales.room.constants.DigitalSalesRoomConstants;
import com.liferay.digital.sales.room.constants.DigitalSalesRoomPortletKeys;
import com.liferay.digital.sales.room.web.internal.util.SiteInitializerUtil;
import com.liferay.object.constants.ObjectActionKeys;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.service.ObjectDefinitionLocalService;
import com.liferay.petra.lang.SafeCloseable;
import com.liferay.portal.kernel.change.tracking.CTCollectionThreadLocal;
import com.liferay.portal.kernel.feature.flag.FeatureFlagListener;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.GroupConstants;
import com.liferay.portal.kernel.model.ResourceConstants;
import com.liferay.portal.kernel.model.Role;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.model.role.RoleConstants;
import com.liferay.portal.kernel.security.permission.ActionKeys;
import com.liferay.portal.kernel.service.GroupLocalService;
import com.liferay.portal.kernel.service.ResourcePermissionLocalService;
import com.liferay.portal.kernel.service.RoleLocalService;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.PortletKeys;
import com.liferay.site.initializer.SiteInitializer;

import java.util.Objects;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Stefano Motta
 */
@Component(
	property = "feature.flag.key=LPD-66359", service = FeatureFlagListener.class
)
public class DigitalSalesRoomFeatureFlagListener
	implements FeatureFlagListener {

	@Override
	public void onValue(
		long companyId, String featureFlagKey, boolean enabled) {

		if (!enabled || !Objects.equals(featureFlagKey, "LPD-66359")) {
			return;
		}

		try (SafeCloseable safeCloseable =
				CTCollectionThreadLocal.setProductionModeWithSafeCloseable()) {

			Group group = _groupLocalService.fetchGroup(
				companyId, GroupConstants.DSR);

			if (group == null) {
				_groupLocalService.addGroup(
					"L_" + GroupConstants.DSR,
					_userLocalService.getGuestUserId(companyId),
					GroupConstants.DEFAULT_PARENT_GROUP_ID, null, 0,
					GroupConstants.DEFAULT_LIVE_GROUP_ID,
					HashMapBuilder.put(
						LocaleUtil.getDefault(), GroupConstants.DSR
					).build(),
					null, GroupConstants.TYPE_SITE_PRIVATE, null, true,
					GroupConstants.DEFAULT_MEMBERSHIP_RESTRICTION,
					DigitalSalesRoomConstants.DSR_FRIENDLY_URL, false, false,
					true, null);
			}

			SiteInitializerUtil.initialize(companyId, _siteInitializer);

			ObjectDefinition dsrRoomObjectDefinition =
				_objectDefinitionLocalService.
					fetchObjectDefinitionByExternalReferenceCode(
						"L_DSR_ROOM", companyId);
			ObjectDefinition dsrTemplateObjectDefinition =
				_objectDefinitionLocalService.
					fetchObjectDefinitionByExternalReferenceCode(
						"L_DSR_TEMPLATE", companyId);

			if ((dsrRoomObjectDefinition == null) ||
				(dsrTemplateObjectDefinition == null)) {

				return;
			}

			Role role = _roleLocalService.fetchRoleByExternalReferenceCode(
				"L_DSR_SELLER", companyId);

			if (role == null) {
				User user = _userLocalService.getGuestUser(companyId);

				role = _roleLocalService.addRole(
					"L_DSR_SELLER", user.getUserId(), null, 0, "DSR Seller",
					null, null, RoleConstants.TYPE_REGULAR, null, null);

				_resourcePermissionLocalService.addResourcePermission(
					role.getCompanyId(),
					DigitalSalesRoomPortletKeys.DIGITAL_SALES_ROOM_MANAGEMENT,
					ResourceConstants.SCOPE_COMPANY,
					String.valueOf(role.getCompanyId()), role.getRoleId(),
					ActionKeys.ACCESS_IN_CONTROL_PANEL);
				_resourcePermissionLocalService.addResourcePermission(
					companyId, PortletKeys.PORTAL,
					ResourceConstants.SCOPE_COMPANY, String.valueOf(companyId),
					role.getRoleId(), ActionKeys.VIEW_CONTROL_PANEL);
				_resourcePermissionLocalService.addResourcePermission(
					role.getCompanyId(),
					dsrRoomObjectDefinition.getResourceName(),
					ResourceConstants.SCOPE_COMPANY, String.valueOf(companyId),
					role.getRoleId(), ObjectActionKeys.ADD_OBJECT_ENTRY);
				_resourcePermissionLocalService.addResourcePermission(
					role.getCompanyId(),
					dsrTemplateObjectDefinition.getResourceName(),
					ResourceConstants.SCOPE_COMPANY, String.valueOf(companyId),
					role.getRoleId(), ObjectActionKeys.ADD_OBJECT_ENTRY);
			}

			role = _roleLocalService.fetchRoleByExternalReferenceCode(
				"L_DSR_CONTRIBUTOR", companyId);

			if (role == null) {
				User user = _userLocalService.getGuestUser(companyId);

				role = _roleLocalService.addRole(
					"L_DSR_CONTRIBUTOR", user.getUserId(), null, 0,
					"DSR Contributor", null, null, RoleConstants.TYPE_SITE,
					null, null);

				_resourcePermissionLocalService.addResourcePermission(
					role.getCompanyId(),
					dsrRoomObjectDefinition.getResourceName(),
					ResourceConstants.SCOPE_COMPANY, String.valueOf(companyId),
					role.getRoleId(), "ADD_OBJECT_ENTRY");
			}
		}
		catch (Exception exception) {
			_log.error(exception);
		}
	}

	private static final Log _log = LogFactoryUtil.getLog(
		DigitalSalesRoomFeatureFlagListener.class);

	@Reference
	private GroupLocalService _groupLocalService;

	@Reference
	private ObjectDefinitionLocalService _objectDefinitionLocalService;

	@Reference
	private ResourcePermissionLocalService _resourcePermissionLocalService;

	@Reference
	private RoleLocalService _roleLocalService;

	@Reference(
		target = "(site.initializer.key=com.liferay.digital.sales.room.site.initializer)"
	)
	private SiteInitializer _siteInitializer;

	@Reference
	private UserLocalService _userLocalService;

}