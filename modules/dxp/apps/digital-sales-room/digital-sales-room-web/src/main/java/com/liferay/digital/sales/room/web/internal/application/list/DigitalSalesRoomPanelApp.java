/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.digital.sales.room.web.internal.application.list;

import com.liferay.application.list.BasePanelApp;
import com.liferay.application.list.PanelApp;
import com.liferay.digital.sales.room.constants.DigitalSalesRoomPortletKeys;
import com.liferay.digital.sales.room.web.internal.constants.DigitalSalesRoomPanelCategoryKeys;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.Portlet;

import com.liferay.portal.kernel.security.permission.ActionKeys;
import com.liferay.portal.kernel.security.permission.PermissionChecker;
import com.liferay.portal.kernel.service.permission.PortletPermissionUtil;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.util.Objects;

/**
 * @author Stefano Motta
 */
@Component(
	property = {
		"panel.app.order:Integer=100",
		"panel.category.key=" + DigitalSalesRoomPanelCategoryKeys.DIGITAL_SALES_ROOM_MANAGEMENT
	},
	service = PanelApp.class
)
public class DigitalSalesRoomPanelApp extends BasePanelApp {

	@Override
	public Portlet getPortlet() {
		return _portlet;
	}

	@Override
	public String getPortletId() {
		return DigitalSalesRoomPortletKeys.DIGITAL_SALES_ROOM_MANAGEMENT;
	}

	@Reference(
		target = "(jakarta.portlet.name=" + DigitalSalesRoomPortletKeys.DIGITAL_SALES_ROOM_MANAGEMENT + ")"
	)
	private Portlet _portlet;

	@Override
	public boolean isShow(PermissionChecker permissionChecker, Group group)
		throws PortalException {

		return super.isShow(permissionChecker, group) && PortletPermissionUtil.contains(
			permissionChecker, DigitalSalesRoomPortletKeys.DIGITAL_SALES_ROOM_MANAGEMENT,
			ActionKeys.ACCESS_IN_CONTROL_PANEL);
	}

}