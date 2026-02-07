/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.digital.sales.room.web.internal.fragment.renderer;

import com.liferay.digital.sales.room.web.internal.display.context.ViewDigitalSalesRoomRoomListDisplayContext;
import com.liferay.fragment.renderer.FragmentRenderer;
import com.liferay.object.service.ObjectDefinitionLocalService;
import com.liferay.portal.kernel.service.GroupService;
import com.liferay.portal.kernel.util.Portal;

import jakarta.servlet.http.HttpServletRequest;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Stefano Motta
 */
@Component(service = FragmentRenderer.class)
public class ViewDigitalSalesRoomRoomListJSPSectionFragmentRenderer
	extends BaseJSPSectionFragmentRenderer
		<ViewDigitalSalesRoomRoomListDisplayContext> {

	@Override
	public String getCollectionKey() {
		return "sections";
	}

	@Override
	public String getLabelKey() {
		return "rooms";
	}

	@Override
	protected ViewDigitalSalesRoomRoomListDisplayContext getDisplayContext(
		HttpServletRequest httpServletRequest) {

		return new ViewDigitalSalesRoomRoomListDisplayContext(
			_groupService, httpServletRequest, _objectDefinitionLocalService,
			_portal);
	}

	@Override
	protected String getJSPPath() {
		return "/room/view.jsp";
	}

	@Reference
	private GroupService _groupService;

	@Reference
	private ObjectDefinitionLocalService _objectDefinitionLocalService;

	@Reference
	private Portal _portal;

}