/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.digital.sales.room.web.internal.display.context;

import com.liferay.digital.sales.room.constants.DigitalSalesRoomConstants;
import com.liferay.digital.sales.room.constants.DigitalSalesRoomPortletKeys;
import com.liferay.frontend.data.set.model.FDSActionDropdownItem;
import com.liferay.frontend.data.set.model.FDSActionDropdownItemBuilder;
import com.liferay.frontend.data.set.model.FDSActionDropdownItemList;
import com.liferay.frontend.taglib.clay.servlet.taglib.util.CreationMenu;
import com.liferay.frontend.taglib.clay.servlet.taglib.util.CreationMenuBuilder;
import com.liferay.object.constants.ObjectActionKeys;
import com.liferay.object.definition.security.permission.resource.ObjectDefinitionPortletResourcePermissionRegistryUtil;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.service.ObjectDefinitionLocalService;
import com.liferay.petra.string.StringBundler;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.model.GroupConstants;
import com.liferay.portal.kernel.portlet.url.builder.PortletURLBuilder;
import com.liferay.portal.kernel.security.permission.PermissionThreadLocal;
import com.liferay.portal.kernel.security.permission.resource.PortletResourcePermission;
import com.liferay.portal.kernel.service.GroupService;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.LinkedHashMapBuilder;
import com.liferay.portal.kernel.util.Portal;

import com.liferay.portal.kernel.util.PortalUtil;
import com.liferay.portal.kernel.util.WebKeys;
import jakarta.portlet.PortletRequest;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

/**
 * @author Stefano Motta
 */
public class ViewDigitalSalesRoomRoomListDisplayContext {

	public ViewDigitalSalesRoomRoomListDisplayContext(
		GroupService groupService, HttpServletRequest httpServletRequest,
		ObjectDefinitionLocalService objectDefinitionLocalService,
		Portal portal) {

		_groupService = groupService;
		_httpServletRequest = httpServletRequest;
		_objectDefinitionLocalService = objectDefinitionLocalService;
		_portal = portal;
	}

	public String getAPIURL() {
		return "/o/headless-digital-sales-room/v1.0/digital-sales-rooms";
	}

	public CreationMenu getCreationMenu() throws Exception {
		ObjectDefinition dsrRoomObjectDefinition = _getDSRRoomObjectDefinition();

		PortletResourcePermission portletResourcePermission =
			ObjectDefinitionPortletResourcePermissionRegistryUtil.getService(
				dsrRoomObjectDefinition.getResourceName());

		if (!portletResourcePermission.contains(
			PermissionThreadLocal.getPermissionChecker(), 0L,
			ObjectActionKeys.ADD_OBJECT_ENTRY)) {
			return null;
		}

		ObjectDefinition dsrTemplateObjectDefinition = _getDSRTemplateObjectDefinition();

		long[] classNameIds = {
			_portal.getClassNameId(dsrTemplateObjectDefinition.getClassName())
		};

		int count = _groupService.searchCount(
			dsrTemplateObjectDefinition.getCompanyId(), classNameIds, StringPool.BLANK,
			LinkedHashMapBuilder.<String, Object>put(
				"active", true
			).put(
				"site", true
			).build());

		CreationMenu creationMenu = CreationMenuBuilder.addPrimaryDropdownItem(
			dropdownItem -> {
				dropdownItem.putData("action", "addDigitalSalesRoom");
				dropdownItem.setIcon("paste");

				if (count == 0) {
					dropdownItem.setLabel(
						LanguageUtil.get(
							_httpServletRequest, "new-digital-sales-room"));
				}
				else {
					dropdownItem.setLabel(
						LanguageUtil.get(
							_httpServletRequest, "start-from-scratch"));
				}
			}
		).build();

		if (count == 0) {
			return creationMenu;
		}

		creationMenu.addDropdownItem(
			dropdownItem -> {
				dropdownItem.putData(
					"action", "addDigitalSalesRoomFromTemplate");
				dropdownItem.setIcon("paste-plaintext");
				dropdownItem.setLabel(
					LanguageUtil.get(
						_httpServletRequest, "start-from-template"));
			});

		return creationMenu;
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
			FDSActionDropdownItemBuilder.setIcon(
				"download"
			).setLabel(
				LanguageUtil.get(_httpServletRequest, "save-as-template")
			).setMethod(
				"post"
			).setPermissionKey("create-template").build(
				"saveAsTemplate"
			),
			FDSActionDropdownItemBuilder.setIcon(
				"envelope-open"
			).setLabel(
				LanguageUtil.get(_httpServletRequest, "share")
			).setMethod(
				"post"
			).setPermissionKey("update").build(
				"share"
			),
			FDSActionDropdownItemBuilder.setHref(
				() -> {
					ThemeDisplay themeDisplay = (ThemeDisplay)_httpServletRequest.getAttribute(
						WebKeys.THEME_DISPLAY);

					ObjectDefinition objectDefinition = _getDSRRoomObjectDefinition();

					return StringBundler.concat(
						themeDisplay.getPathFriendlyURLPublic(),
						DigitalSalesRoomConstants.DSR_FRIENDLY_URL, "/e/room/",
						PortalUtil.getClassNameId(objectDefinition.getClassName()),
						StringPool.SLASH, "{classPK}");
				}
			).setIcon(
				"cog"
			).setLabel(
				LanguageUtil.get(_httpServletRequest, "settings")
			).setMethod(
				"get"
			).setPermissionKey("update").build(
				"settings"
			),
			FDSActionDropdownItemBuilder.setIcon(
				"trash"
			).setLabel(
				LanguageUtil.get(_httpServletRequest, "delete")
			).setMethod(
				"delete"
			).setPermissionKey("delete").build(
				"delete"
			));
	}

	private ObjectDefinition _getDSRTemplateObjectDefinition() throws Exception {
		if (_dsrTemplateObjectDefinition != null) {
			return _dsrTemplateObjectDefinition;
		}

		_dsrTemplateObjectDefinition =
			_objectDefinitionLocalService.
				getObjectDefinitionByExternalReferenceCode(
					"L_DSR_TEMPLATE",
					_portal.getCompanyId(_httpServletRequest));

		return _dsrTemplateObjectDefinition;
	}

	private ObjectDefinition _getDSRRoomObjectDefinition() throws Exception {
		if (_dsrRoomObjectDefinition != null) {
			return _dsrRoomObjectDefinition;
		}

		_dsrRoomObjectDefinition =
			_objectDefinitionLocalService.
				getObjectDefinitionByExternalReferenceCode(
					"L_DSR_ROOM",
					_portal.getCompanyId(_httpServletRequest));

		return _dsrRoomObjectDefinition;
	}

	private final GroupService _groupService;
	private final HttpServletRequest _httpServletRequest;
	private ObjectDefinition _dsrTemplateObjectDefinition;
	private ObjectDefinition _dsrRoomObjectDefinition;
	private final ObjectDefinitionLocalService _objectDefinitionLocalService;
	private final Portal _portal;

}