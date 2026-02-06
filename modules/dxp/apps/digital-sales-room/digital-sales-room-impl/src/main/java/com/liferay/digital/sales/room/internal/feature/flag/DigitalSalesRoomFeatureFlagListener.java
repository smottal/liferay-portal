/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.digital.sales.room.internal.feature.flag;

import com.liferay.digital.sales.room.constants.DigitalSalesRoomPortletKeys;
import com.liferay.object.constants.ObjectActionKeys;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.service.ObjectDefinitionLocalService;
import com.liferay.portal.kernel.feature.flag.FeatureFlagListener;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.ResourceConstants;
import com.liferay.portal.kernel.model.Role;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.model.role.RoleConstants;
import com.liferay.portal.kernel.security.permission.ActionKeys;
import com.liferay.portal.kernel.service.ResourcePermissionLocalService;
import com.liferay.portal.kernel.service.RoleLocalService;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.util.PortletKeys;

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

		try {
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
			if (_log.isWarnEnabled()) {
				_log.warn(exception);
			}
		}
	}

	private static final Log _log = LogFactoryUtil.getLog(
		DigitalSalesRoomFeatureFlagListener.class);

	@Reference
	private ObjectDefinitionLocalService _objectDefinitionLocalService;

	@Reference
	private ResourcePermissionLocalService _resourcePermissionLocalService;

	@Reference
	private RoleLocalService _roleLocalService;

	@Reference
	private UserLocalService _userLocalService;

}