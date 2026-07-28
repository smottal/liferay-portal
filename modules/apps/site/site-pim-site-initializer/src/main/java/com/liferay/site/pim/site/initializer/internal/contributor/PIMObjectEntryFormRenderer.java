/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.site.pim.site.initializer.internal.contributor;

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
		ObjectFieldLocalService objectFieldLocalService,
		ObjectLayoutLocalService objectLayoutLocalService) {

		_objectFieldLocalService = objectFieldLocalService;
		_objectLayoutLocalService = objectLayoutLocalService;
	}

	@Override
	public LayoutStructure render(
			FormManager formManager,
			FragmentEntryLinkListenerRegistry fragmentEntryLinkListenerRegistry,
			List<FragmentEntryLink> fragmentEntryLinks,
			FragmentEntryLinkService fragmentEntryLinkService,
			FragmentRendererRegistry fragmentRendererRegistry,
			InfoFieldSet infoFieldSet, Layout layout,
			LayoutStructure layoutStructure,
			LayoutStructureItem layoutStructureItem,
			ObjectDefinition objectDefinition, long segmentsExperienceId,
			ServiceContext serviceContext)
		throws Exception {

		ObjectLayout objectLayout =
			_objectLayoutLocalService.fetchDefaultObjectLayout(
				objectDefinition.getObjectDefinitionId());

		if (objectLayout == null) {
			return CMSObjectEntryFormLayoutUtil.addInputFragmentEntryLinks(
				fragmentEntryLinks, true, fragmentEntryLinkListenerRegistry,
				fragmentEntryLinkService, formManager, fragmentRendererRegistry,
				infoFieldSet, layout, layoutStructure, layoutStructureItem,
				objectDefinition.getName(), false, true, segmentsExperienceId,
				serviceContext, JSONUtil.put("marginBottom", "16px"));
		}

		return _addObjectLayoutFragmentEntryLinks(
			fragmentEntryLinks, fragmentEntryLinkListenerRegistry,
			fragmentEntryLinkService, formManager, fragmentRendererRegistry,
			infoFieldSet, objectLayout, layout, layoutStructure,
			layoutStructureItem, segmentsExperienceId, serviceContext);
	}

	private LayoutStructure _addObjectLayoutBox(
			List<FragmentEntryLink> addedFragmentEntryLinks,
			FragmentEntryLinkListenerRegistry fragmentEntryLinkListenerRegistry,
			FragmentEntryLinkService fragmentEntryLinkService,
			FormManager formManager,
			FragmentRendererRegistry fragmentRendererRegistry,
			Map<String, InfoField<?>> infoFieldsByName,
			String objectDefinitionName,
			Map<String, InfoFieldSet> relationshipInfoFieldSetsByName,
			ObjectLayoutBox objectLayoutBox, Layout layout,
			LayoutStructure layoutStructure, String parentItemId,
			long segmentsExperienceId, ServiceContext serviceContext)
		throws Exception {

		String name = objectLayoutBox.getName(
			objectLayoutBox.getDefaultLanguageId());

		if (Validator.isNotNull(name) &&
			name.startsWith(_REP_GROUP_BOX_NAME_PREFIX)) {

			InfoFieldSet relationshipInfoFieldSet =
				relationshipInfoFieldSetsByName.get(
					name.substring(_REP_GROUP_BOX_NAME_PREFIX.length()));

			if (relationshipInfoFieldSet == null) {
				return layoutStructure;
			}

			return CMSObjectEntryFormLayoutUtil.addInputFragmentEntryLinks(
				addedFragmentEntryLinks, true,
				fragmentEntryLinkListenerRegistry, fragmentEntryLinkService,
				formManager, fragmentRendererRegistry, relationshipInfoFieldSet,
				layout, layoutStructure,
				layoutStructure.getLayoutStructureItem(parentItemId),
				objectDefinitionName, false, true, segmentsExperienceId,
				serviceContext, JSONUtil.put("marginBottom", "16px"));
		}

		String contentParentItemId = parentItemId;

		if (objectLayoutBox.isCollapsable()) {
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
										objectLayoutBox.getNameMap())))),
					fragmentEntryLinkService, fragmentRendererRegistry,
					"BASIC_COMPONENT-accordion", layout, segmentsExperienceId,
					serviceContext);

			if (accordionFragmentEntryLink != null) {
				LayoutStructureItem accordionLayoutStructureItem =
					layoutStructure.addFragmentStyledLayoutStructureItem(
						accordionFragmentEntryLink.getFragmentEntryLinkId(),
						parentItemId, -1);

				accordionLayoutStructureItem.updateItemConfig(
					JSONUtil.put(
						"styles", JSONUtil.put("marginBottom", "16px")));

				String accordionItemId =
					accordionLayoutStructureItem.getItemId();

				addedFragmentEntryLinks.add(accordionFragmentEntryLink);

				layoutStructure =
					CMSObjectEntryFormLayoutUtil.
						persistAndRefetchLayoutStructure(
							fragmentEntryLinkListenerRegistry, layout,
							layoutStructure, segmentsExperienceId,
							serviceContext, accordionFragmentEntryLink);

				accordionLayoutStructureItem =
					layoutStructure.getLayoutStructureItem(accordionItemId);

				String accordionDropZoneItemId =
					accordionLayoutStructureItem.getChildrenItemId(0);

				if (accordionDropZoneItemId != null) {
					contentParentItemId = accordionDropZoneItemId;
				}
			}
		}

		LayoutStructureItem contentParentLayoutStructureItem =
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
					addedFragmentEntryLinks, true, formManager, infoField,
					layout, layoutStructure, contentParentLayoutStructureItem,
					false, segmentsExperienceId, serviceContext,
					JSONUtil.put("marginBottom", "16px"));
			}
		}

		return layoutStructure;
	}

	private LayoutStructure _addObjectLayoutFragmentEntryLinks(
			List<FragmentEntryLink> addedFragmentEntryLinks,
			FragmentEntryLinkListenerRegistry fragmentEntryLinkListenerRegistry,
			FragmentEntryLinkService fragmentEntryLinkService,
			FormManager formManager,
			FragmentRendererRegistry fragmentRendererRegistry,
			InfoFieldSet objectInfoFieldSet, ObjectLayout objectLayout,
			Layout layout, LayoutStructure layoutStructure,
			LayoutStructureItem formStyledLayoutStructureItem,
			long segmentsExperienceId, ServiceContext serviceContext)
		throws Exception {

		Map<String, InfoField<?>> infoFieldsByName = new HashMap<>();
		Map<String, InfoFieldSet> relationshipInfoFieldSetsByName =
			new HashMap<>();

		for (InfoFieldSetEntry infoFieldSetEntry :
				objectInfoFieldSet.getInfoFieldSetEntries()) {

			if (infoFieldSetEntry instanceof InfoField) {
				infoFieldsByName.put(
					infoFieldSetEntry.getName(),
					(InfoField<?>)infoFieldSetEntry);
			}
			else if (infoFieldSetEntry instanceof InfoFieldSet) {
				InfoFieldSet infoFieldSet = (InfoFieldSet)infoFieldSetEntry;

				if (infoFieldSet.isRelationship()) {
					relationshipInfoFieldSetsByName.put(
						infoFieldSet.getName(), infoFieldSet);
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

		FragmentEntryLink tabsFragmentEntryLink =
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
				fragmentEntryLinkService, fragmentRendererRegistry,
				"BASIC_COMPONENT-tabs", layout, segmentsExperienceId,
				serviceContext);

		if (tabsFragmentEntryLink == null) {
			return layoutStructure;
		}

		LayoutStructureItem tabsLayoutStructureItem =
			layoutStructure.addFragmentStyledLayoutStructureItem(
				tabsFragmentEntryLink.getFragmentEntryLinkId(),
				formStyledLayoutStructureItem.getItemId(), -1);

		String tabsItemId = tabsLayoutStructureItem.getItemId();

		addedFragmentEntryLinks.add(tabsFragmentEntryLink);

		layoutStructure =
			CMSObjectEntryFormLayoutUtil.persistAndRefetchLayoutStructure(
				fragmentEntryLinkListenerRegistry, layout, layoutStructure,
				segmentsExperienceId, serviceContext, tabsFragmentEntryLink);

		for (int i = 0; i < objectLayoutTabs.size(); i++) {
			ObjectLayoutTab objectLayoutTab = objectLayoutTabs.get(i);

			tabsLayoutStructureItem = layoutStructure.getLayoutStructureItem(
				tabsItemId);

			String tabDropZoneItemId =
				tabsLayoutStructureItem.getChildrenItemId(i);

			if (tabDropZoneItemId == null) {
				continue;
			}

			for (ObjectLayoutBox objectLayoutBox :
					objectLayoutTab.getObjectLayoutBoxes()) {

				layoutStructure = _addObjectLayoutBox(
					addedFragmentEntryLinks, fragmentEntryLinkListenerRegistry,
					fragmentEntryLinkService, formManager,
					fragmentRendererRegistry, infoFieldsByName,
					objectInfoFieldSet.getName(),
					relationshipInfoFieldSetsByName, objectLayoutBox, layout,
					layoutStructure, tabDropZoneItemId, segmentsExperienceId,
					serviceContext);
			}
		}

		return layoutStructure;
	}

	private static final String _REP_GROUP_BOX_NAME_PREFIX = "rep-group-";

	private final ObjectFieldLocalService _objectFieldLocalService;
	private final ObjectLayoutLocalService _objectLayoutLocalService;

}