/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.site.pim.site.initializer.internal.renderer;

import com.liferay.fragment.entry.processor.constants.FragmentEntryProcessorConstants;
import com.liferay.fragment.listener.FragmentEntryLinkListenerRegistry;
import com.liferay.fragment.model.FragmentEntryLink;
import com.liferay.fragment.renderer.FragmentRendererRegistry;
import com.liferay.fragment.service.FragmentEntryLinkService;
import com.liferay.info.field.InfoField;
import com.liferay.info.field.InfoFieldSet;
import com.liferay.info.field.InfoFieldSetEntry;
import com.liferay.layout.manager.FormManager;
import com.liferay.layout.util.structure.LayoutStructure;
import com.liferay.layout.util.structure.LayoutStructureItem;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.model.ObjectField;
import com.liferay.object.model.ObjectLayout;
import com.liferay.object.model.ObjectLayoutBox;
import com.liferay.object.model.ObjectLayoutColumn;
import com.liferay.object.model.ObjectLayoutRow;
import com.liferay.object.model.ObjectLayoutTab;
import com.liferay.object.service.ObjectFieldLocalService;
import com.liferay.object.service.ObjectLayoutLocalService;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.site.cms.site.initializer.renderer.ObjectEntryFormRenderer;
import com.liferay.site.cms.site.initializer.util.CMSObjectEntryFormLayoutUtil;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author Stefano Motta
 */
public class PIMObjectEntryFormRenderer implements ObjectEntryFormRenderer {

	public PIMObjectEntryFormRenderer(
		FormManager formManager,
		FragmentEntryLinkListenerRegistry fragmentEntryLinkListenerRegistry,
		FragmentEntryLinkService fragmentEntryLinkService,
		FragmentRendererRegistry fragmentRendererRegistry,
		ObjectFieldLocalService objectFieldLocalService,
		ObjectLayoutLocalService objectLayoutLocalService) {

		_formManager = formManager;
		_fragmentEntryLinkListenerRegistry = fragmentEntryLinkListenerRegistry;
		_fragmentEntryLinkService = fragmentEntryLinkService;
		_fragmentRendererRegistry = fragmentRendererRegistry;
		_objectFieldLocalService = objectFieldLocalService;
		_objectLayoutLocalService = objectLayoutLocalService;
	}

	@Override
	public LayoutStructure render(
			List<FragmentEntryLink> fragmentEntryLinks, InfoFieldSet infoFieldSet,
			Layout layout, LayoutStructure layoutStructure,
			LayoutStructureItem layoutStructureItem,
			ObjectDefinition objectDefinition, long segmentsExperienceId,
			ServiceContext serviceContext)
		throws Exception {

		ObjectLayout objectLayout =
			_objectLayoutLocalService.fetchDefaultObjectLayout(
				objectDefinition.getObjectDefinitionId());

		if (objectLayout == null) {
			return CMSObjectEntryFormLayoutUtil.addInputFragmentEntryLinks(
				true, _formManager, _fragmentEntryLinkListenerRegistry,
				fragmentEntryLinks, _fragmentEntryLinkService,
				_fragmentRendererRegistry, infoFieldSet, layout, layoutStructure,
				layoutStructureItem, objectDefinition.getName(), false, true,
				segmentsExperienceId, JSONUtil.put("marginBottom", "16px"),
				serviceContext);
		}

		return _addObjectLayoutFragmentEntryLinks(
			fragmentEntryLinks, infoFieldSet, layout, layoutStructure,
			layoutStructureItem, objectLayout, segmentsExperienceId,
			serviceContext);
	}

	private LayoutStructure _addObjectLayoutBox(
			List<FragmentEntryLink> fragmentEntryLinks,
			Map<String, InfoField<?>> infoFieldsByName,
			Map<String, InfoFieldSet> infoFieldSetsByName, Layout layout,
			LayoutStructure layoutStructure, String objectDefinitionName,
			ObjectLayoutBox objectLayoutBox, String parentItemId,
			long segmentsExperienceId, ServiceContext serviceContext)
		throws Exception {

		String name = objectLayoutBox.getName(
			objectLayoutBox.getDefaultLanguageId());

		if (Validator.isNotNull(name) &&
			name.startsWith(_REPEATABLE_GROUP_NAME_PREFIX)) {

			InfoFieldSet infoFieldSet = infoFieldSetsByName.get(
				name.substring(_REPEATABLE_GROUP_NAME_PREFIX.length()));

			if (infoFieldSet == null) {
				return layoutStructure;
			}

			return CMSObjectEntryFormLayoutUtil.addInputFragmentEntryLinks(
				true, _formManager, _fragmentEntryLinkListenerRegistry,
				fragmentEntryLinks, _fragmentEntryLinkService,
				_fragmentRendererRegistry, infoFieldSet, layout, layoutStructure,
				layoutStructure.getLayoutStructureItem(parentItemId),
				objectDefinitionName, false, true, segmentsExperienceId,
				JSONUtil.put("marginBottom", "16px"), serviceContext);
		}

		String contentParentItemId = parentItemId;

		if (objectLayoutBox.isCollapsable()) {
			FragmentEntryLink fragmentEntryLink =
				CMSObjectEntryFormLayoutUtil.addFragmentEntryLink(
					JSONUtil.toString(
						JSONUtil.put(
							FragmentEntryProcessorConstants.
								KEY_EDITABLE_FRAGMENT_ENTRY_PROCESSOR,
							JSONUtil.put(
								"accordion-title",
								CMSObjectEntryFormLayoutUtil.
									getLocalizedNameJSONObject(
										objectLayoutBox.getNameMap())))),
					"BASIC_COMPONENT-accordion", _fragmentEntryLinkService,
					_fragmentRendererRegistry, layout, segmentsExperienceId,
					serviceContext);

			if (fragmentEntryLink != null) {
				LayoutStructureItem layoutStructureItem =
					layoutStructure.addFragmentStyledLayoutStructureItem(
						fragmentEntryLink.getFragmentEntryLinkId(),
						parentItemId, -1);

				layoutStructureItem.updateItemConfig(
					JSONUtil.put(
						"styles", JSONUtil.put("marginBottom", "16px")));

				String itemId = layoutStructureItem.getItemId();

				fragmentEntryLinks.add(fragmentEntryLink);

				layoutStructure =
					CMSObjectEntryFormLayoutUtil.
						persistAndRefetchLayoutStructure(
							fragmentEntryLink,
							_fragmentEntryLinkListenerRegistry, layout,
							layoutStructure, segmentsExperienceId,
							serviceContext);

				layoutStructureItem = layoutStructure.getLayoutStructureItem(
					itemId);

				String childrenItemId = layoutStructureItem.getChildrenItemId(
					0);

				if (Validator.isNotNull(childrenItemId)) {
					contentParentItemId = childrenItemId;
				}
			}
		}

		LayoutStructureItem layoutStructureItem =
			layoutStructure.getLayoutStructureItem(contentParentItemId);

		for (ObjectLayoutRow objectLayoutRow :
				objectLayoutBox.getObjectLayoutRows()) {

			for (ObjectLayoutColumn objectLayoutColumn :
					objectLayoutRow.getObjectLayoutColumns()) {

				ObjectField objectField =
					_objectFieldLocalService.fetchObjectField(
						objectLayoutColumn.getObjectFieldId());

				if (objectField == null) {
					continue;
				}

				InfoField<?> infoField = infoFieldsByName.get(
					objectField.getName());

				if (infoField == null) {
					continue;
				}

				CMSObjectEntryFormLayoutUtil.addInfoFieldFragmentEntryLink(
					true, _formManager, fragmentEntryLinks, infoField, layout,
					layoutStructure, layoutStructureItem, false,
					segmentsExperienceId, JSONUtil.put("marginBottom", "16px"),
					serviceContext);
			}
		}

		return layoutStructure;
	}

	private LayoutStructure _addObjectLayoutFragmentEntryLinks(
			List<FragmentEntryLink> fragmentEntryLinks, InfoFieldSet infoFieldSet,
			Layout layout, LayoutStructure layoutStructure,
			LayoutStructureItem layoutStructureItem, ObjectLayout objectLayout,
			long segmentsExperienceId, ServiceContext serviceContext)
		throws Exception {

		Map<String, InfoField<?>> infoFieldsByName = new HashMap<>();
		Map<String, InfoFieldSet> infoFieldSetsByName = new HashMap<>();

		for (InfoFieldSetEntry infoFieldSetEntry :
				infoFieldSet.getInfoFieldSetEntries()) {

			if (infoFieldSetEntry instanceof InfoField) {
				infoFieldsByName.put(
					infoFieldSetEntry.getName(),
					(InfoField<?>)infoFieldSetEntry);
			}
			else if (infoFieldSetEntry instanceof InfoFieldSet) {
				InfoFieldSet curInfoFieldSet = (InfoFieldSet)infoFieldSetEntry;

				if (curInfoFieldSet.isRelationship()) {
					infoFieldSetsByName.put(
						curInfoFieldSet.getName(), curInfoFieldSet);
				}
			}
		}

		List<ObjectLayoutTab> objectLayoutTabs =
			objectLayout.getObjectLayoutTabs();

		JSONObject titlesJSONObject = JSONFactoryUtil.createJSONObject();

		for (int i = 0; i < objectLayoutTabs.size(); i++) {
			ObjectLayoutTab objectLayoutTab = objectLayoutTabs.get(i);

			titlesJSONObject.put(
				"title" + (i + 1),
				CMSObjectEntryFormLayoutUtil.getLocalizedNameJSONObject(
					objectLayoutTab.getNameMap()));
		}

		FragmentEntryLink fragmentEntryLink =
			CMSObjectEntryFormLayoutUtil.addFragmentEntryLink(
				JSONUtil.toString(
					JSONUtil.put(
						FragmentEntryProcessorConstants.
							KEY_EDITABLE_FRAGMENT_ENTRY_PROCESSOR,
						titlesJSONObject
					).put(
						FragmentEntryProcessorConstants.
							KEY_FREEMARKER_FRAGMENT_ENTRY_PROCESSOR,
						JSONUtil.put(
							"numberOfTabs",
							String.valueOf(objectLayoutTabs.size()))
					)),
				"BASIC_COMPONENT-tabs", _fragmentEntryLinkService,
				_fragmentRendererRegistry, layout, segmentsExperienceId,
				serviceContext);

		if (fragmentEntryLink == null) {
			return layoutStructure;
		}

		layoutStructureItem =
			layoutStructure.addFragmentStyledLayoutStructureItem(
				fragmentEntryLink.getFragmentEntryLinkId(),
				layoutStructureItem.getItemId(), -1);

		String itemId = layoutStructureItem.getItemId();

		fragmentEntryLinks.add(fragmentEntryLink);

		layoutStructure =
			CMSObjectEntryFormLayoutUtil.persistAndRefetchLayoutStructure(
				fragmentEntryLink, _fragmentEntryLinkListenerRegistry, layout,
				layoutStructure, segmentsExperienceId, serviceContext);

		for (int i = 0; i < objectLayoutTabs.size(); i++) {
			ObjectLayoutTab objectLayoutTab = objectLayoutTabs.get(i);

			layoutStructureItem = layoutStructure.getLayoutStructureItem(
				itemId);

			String childrenItemId = layoutStructureItem.getChildrenItemId(i);

			if (Validator.isNull(childrenItemId)) {
				continue;
			}

			FragmentEntryLink accordionFragmentEntryLink =
				CMSObjectEntryFormLayoutUtil.addFragmentEntryLink(
					JSONUtil.toString(
						JSONUtil.put(
							FragmentEntryProcessorConstants.
								KEY_EDITABLE_FRAGMENT_ENTRY_PROCESSOR,
							JSONUtil.put(
								"accordion-title",
								CMSObjectEntryFormLayoutUtil.
									getLocalizedNameJSONObject(
										objectLayoutTab.getNameMap())))),
					"BASIC_COMPONENT-accordion", _fragmentEntryLinkService,
					_fragmentRendererRegistry, layout, segmentsExperienceId,
					serviceContext);

			if (accordionFragmentEntryLink != null) {
				LayoutStructureItem accordionLayoutStructureItem =
					layoutStructure.addFragmentStyledLayoutStructureItem(
						accordionFragmentEntryLink.getFragmentEntryLinkId(),
						childrenItemId, -1);

				accordionLayoutStructureItem.updateItemConfig(
					JSONUtil.put(
						"styles", JSONUtil.put("marginBottom", "16px")));

				String accordionItemId = accordionLayoutStructureItem.getItemId();

				fragmentEntryLinks.add(accordionFragmentEntryLink);

				layoutStructure =
					CMSObjectEntryFormLayoutUtil.
						persistAndRefetchLayoutStructure(
							accordionFragmentEntryLink,
							_fragmentEntryLinkListenerRegistry, layout,
							layoutStructure, segmentsExperienceId,
							serviceContext);

				accordionLayoutStructureItem =
					layoutStructure.getLayoutStructureItem(accordionItemId);

				String accordionChildrenItemId =
					accordionLayoutStructureItem.getChildrenItemId(0);

				if (Validator.isNotNull(accordionChildrenItemId)) {
					childrenItemId = accordionChildrenItemId;
				}
			}

			for (ObjectLayoutBox objectLayoutBox :
					objectLayoutTab.getObjectLayoutBoxes()) {

				layoutStructure = _addObjectLayoutBox(
					fragmentEntryLinks, infoFieldsByName, infoFieldSetsByName,
					layout, layoutStructure, infoFieldSet.getName(),
					objectLayoutBox, childrenItemId, segmentsExperienceId,
					serviceContext);
			}
		}

		return layoutStructure;
	}

	private static final String _REPEATABLE_GROUP_NAME_PREFIX =
		"repeatable-group-";

	private final FormManager _formManager;
	private final FragmentEntryLinkListenerRegistry
		_fragmentEntryLinkListenerRegistry;
	private final FragmentEntryLinkService _fragmentEntryLinkService;
	private final FragmentRendererRegistry _fragmentRendererRegistry;
	private final ObjectFieldLocalService _objectFieldLocalService;
	private final ObjectLayoutLocalService _objectLayoutLocalService;

}
