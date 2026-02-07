/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.digital.sales.room.web.internal.display.context;

import com.liferay.digital.sales.room.constants.DigitalSalesRoomConstants;
import com.liferay.frontend.data.set.model.FDSActionDropdownItem;
import com.liferay.frontend.data.set.model.FDSActionDropdownItemBuilder;
import com.liferay.frontend.data.set.model.FDSActionDropdownItemList;
import com.liferay.frontend.taglib.clay.servlet.taglib.util.CreationMenu;
import com.liferay.frontend.taglib.clay.servlet.taglib.util.CreationMenuBuilder;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.service.ObjectDefinitionLocalService;
import com.liferay.petra.string.StringBundler;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.PortalUtil;
import com.liferay.portal.kernel.util.WebKeys;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

/**
 * @author Stefano Motta
 */
public class ViewDigitalSalesRoomTemplateListDisplayContext {

	public ViewDigitalSalesRoomTemplateListDisplayContext(
		HttpServletRequest httpServletRequest,
		ObjectDefinitionLocalService objectDefinitionLocalService,
		Portal portal) {

		_httpServletRequest = httpServletRequest;
		_objectDefinitionLocalService = objectDefinitionLocalService;
		_portal = portal;
	}

	public String getAPIURL() {
		return "/o/headless-digital-sales-room/v1.0" +
			"/digital-sales-room-templates";
	}

	public CreationMenu getCreationMenu() {
		return CreationMenuBuilder.addPrimaryDropdownItem(
			dropdownItem -> {
				dropdownItem.putData("action", "addDigitalSalesRoomTemplate");
				dropdownItem.setLabel(
					LanguageUtil.get(
						_httpServletRequest,
						"new-digital-sales-room-template"));
			}
		).build();
	}

	public List<FDSActionDropdownItem> getFDSActionDropdownItems()
		throws Exception {

		return FDSActionDropdownItemList.of(
			FDSActionDropdownItemBuilder.setIcon(
				"pencil"
			).setLabel(
				LanguageUtil.get(_httpServletRequest, "edit")
			).setMethod(
				"patch"
			).build(
				"edit"
			),
			FDSActionDropdownItemBuilder.setHref(
				() -> {
					ThemeDisplay themeDisplay =
						(ThemeDisplay)_httpServletRequest.getAttribute(
							WebKeys.THEME_DISPLAY);

					ObjectDefinition objectDefinition = _getObjectDefinition();

					return StringBundler.concat(
						themeDisplay.getPathFriendlyURLPublic(),
						DigitalSalesRoomConstants.DSR_FRIENDLY_URL,
						"/e/template/",
						PortalUtil.getClassNameId(
							objectDefinition.getClassName()),
						"/{classPK}");
				}
			).setIcon(
				"cog"
			).setLabel(
				LanguageUtil.get(_httpServletRequest, "settings")
			).setMethod(
				"get"
			).build(
				"settings"
			),
			FDSActionDropdownItemBuilder.setIcon(
				"copy"
			).setLabel(
				LanguageUtil.get(_httpServletRequest, "duplicate")
			).setMethod(
				"post"
			).build(
				"duplicate"
			),
			FDSActionDropdownItemBuilder.setIcon(
				"trash"
			).setLabel(
				LanguageUtil.get(_httpServletRequest, "delete")
			).setMethod(
				"delete"
			).build(
				"delete"
			));
	}

	private ObjectDefinition _getObjectDefinition() throws Exception {
		if (_objectDefinition != null) {
			return _objectDefinition;
		}

		_objectDefinition =
			_objectDefinitionLocalService.
				getObjectDefinitionByExternalReferenceCode(
					"L_DSR_TEMPLATE",
					_portal.getCompanyId(_httpServletRequest));

		return _objectDefinition;
	}

	private final HttpServletRequest _httpServletRequest;
	private ObjectDefinition _objectDefinition;
	private final ObjectDefinitionLocalService _objectDefinitionLocalService;
	private final Portal _portal;

}