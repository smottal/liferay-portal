/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.digital.sales.room.internal.feature.flag;

import com.liferay.digital.sales.room.constants.DigitalSalesRoomPortletKeys;
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
import com.liferay.portal.kernel.security.permission.PermissionThreadLocal;
import com.liferay.portal.kernel.service.ResourcePermissionLocalService;
import com.liferay.portal.kernel.service.RoleLocalService;

import java.util.Objects;

import com.liferay.portal.kernel.service.UserLocalService;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Stefano Motta
 */
@Component(
	property = "feature.flag.key=LPD-66359", service = FeatureFlagListener.class
)
public class DigitalSalesRoomFeatureFlagListener implements FeatureFlagListener {

	@Override
	public void onValue(
		long companyId, String featureFlagKey, boolean enabled) {

		System.out.println("ciao");

		if (!enabled || !Objects.equals(featureFlagKey, "LPD-66359")) {
			return;
		}

		ObjectDefinition objectDefinition = _objectDefinitionLocalService.fetchObjectDefinitionByExternalReferenceCode(
			"L_DSR_ROOM", companyId
		);

		System.out.println(objectDefinition.getResourceName());
		System.out.println(objectDefinition.getClassName());
		System.out.println(objectDefinition.getModelClassName());

		if (objectDefinition == null) {
			return;
		}

		try {
			Role role = _roleLocalService.fetchRole(companyId, "DSR Seller");

			System.out.println(role);

			if (role != null) {
				_roleLocalService.deleteRole(role);

				role = null;
			}

			if (role == null) {

				User user = _userLocalService.getGuestUser(companyId);

					role = _roleLocalService.addRole(
						"L_DSR_SELLER", user.getUserId(), null, 0, "DSR Seller",
						null,
						null, RoleConstants.TYPE_REGULAR,
						null, null);

				_resourcePermissionLocalService.addResourcePermission(
					role.getCompanyId(), DigitalSalesRoomPortletKeys.DIGITAL_SALES_ROOM_MANAGEMENT,
					ResourceConstants.SCOPE_COMPANY,
					String.valueOf(role.getCompanyId()), role.getRoleId(),
					ActionKeys.ACCESS_IN_CONTROL_PANEL);

				_resourcePermissionLocalService.addResourcePermission(
					role.getCompanyId(), objectDefinition.getResourceName(),
					ResourceConstants.SCOPE_COMPANY,
					String.valueOf(companyId), role.getRoleId(),
					"ADD_OBJECT_ENTRY");
			}

			/*
			{
					"actionIds": [
						"VIEW_CONTROL_PANEL"
					],
					"label": "90",
					"primaryKey": "57646087144299",
					"resourceName": "90",
					"scope": 1
				},
				{
					"actionIds": [
						"ACCESS_IN_CONTROL_PANEL"
					],
					"primaryKey": "57646087144299",
					"resourceName": "com_liferay_digital_sales_room_web_internal_portlet_DigitalSalesRoomManagementPortlet",
					"scope": 1
				},
				{
					"actionIds": [
						"VIEW"
					],
					"primaryKey": "57646087144299",
					"resourceName": "com.liferay.object.model.ObjectDefinition#D1S2",
					"scope": 1
				},
				{
					"actionIds": [
						"ADD_OBJECT_ENTRY"
					],
					"id": 60623,
					"label": "com.liferay.object#60627",
					"primaryKey": "57646087144299",
					"resourceName": "com.liferay.object#60627",
					"roleId": 60623,
					"scope": 1
				}
			 */

			role = _roleLocalService.fetchRole(companyId, "DSR Contributor");

			if (role == null) {

			}

		}catch (Exception exception) {
			if (_log.isWarnEnabled()) {
				_log.warn(exception);
			}
		}
	}

	@Reference
	private ObjectDefinitionLocalService _objectDefinitionLocalService;

	@Reference
	private ResourcePermissionLocalService _resourcePermissionLocalService;

	public static final Log _log = LogFactoryUtil.getLog(
		DigitalSalesRoomFeatureFlagListener.class);


	@Reference
	private UserLocalService _userLocalService;

	@Reference
	private RoleLocalService _roleLocalService;

}