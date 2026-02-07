/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.digital.sales.room.web.internal.display.context;

import com.liferay.digital.sales.room.web.internal.constants.DigitalSalesRoomScreenNavigationEntryConstants;
import com.liferay.petra.string.StringBundler;
import com.liferay.portal.kernel.model.GroupConstants;
import com.liferay.portal.kernel.portlet.url.builder.PortletURLBuilder;
import com.liferay.portal.kernel.theme.PortletDisplay;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.JavaConstants;
import com.liferay.portal.kernel.util.WebKeys;

import jakarta.portlet.RenderResponse;

import jakarta.servlet.http.HttpServletRequest;

/**
 * @author Stefano Motta
 */
public class EditDigitalSalesRoomRoomSettingsDisplayContext {

	public EditDigitalSalesRoomRoomSettingsDisplayContext(
		long digitalSalesRoomId, HttpServletRequest httpServletRequest, String step) {

		_digitalSalesRoomId = digitalSalesRoomId;
		_step = step;
		_themeDisplay =
			(ThemeDisplay)httpServletRequest.getAttribute(
				WebKeys.THEME_DISPLAY);
	}

	public String getCancelURL(RenderResponse renderResponse) {
		return StringBundler.concat(
			_themeDisplay.getPathFriendlyURLPublic(),
			"/dsr", "/rooms");
	}

	public String getStep() {
		return _step;
	}

	public long getDigitalSalesRoomId() {
		return _digitalSalesRoomId;
	}

	private final long _digitalSalesRoomId;
	private final ThemeDisplay _themeDisplay;
	private final String _step;

}