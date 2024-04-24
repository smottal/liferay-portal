/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.defaultpermissions.kernel.configuration.provider;

import com.liferay.portal.kernel.module.service.Snapshot;

import java.util.Map;

/**
 * @author Stefano Motta
 */
public class PortalDefaultPermissionsConfigurationProviderUtil {

	public static Map<String, String[]> getDefaultPermissions(
		long companyId, long groupId, String className) {

		PortalDefaultPermissionsConfiguration
			portalDefaultPermissionsConfiguration =
				_portalDefaultPermissionsConfigurationProviderSnapshot.get();

		if (portalDefaultPermissionsConfiguration == null) {
			return null;
		}

		return portalDefaultPermissionsConfiguration.getDefaultPermissions(
			companyId, groupId, className);
	}

	private static final Snapshot<PortalDefaultPermissionsConfiguration>
		_portalDefaultPermissionsConfigurationProviderSnapshot = new Snapshot<>(
			PortalDefaultPermissionsConfigurationProviderUtil.class,
			PortalDefaultPermissionsConfiguration.class,
			"(portal.default.permissions.scope=group)");

}