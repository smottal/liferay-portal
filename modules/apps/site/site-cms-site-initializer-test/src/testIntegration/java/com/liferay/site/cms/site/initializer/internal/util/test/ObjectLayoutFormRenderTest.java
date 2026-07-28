/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.site.cms.site.initializer.internal.util.test;

import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.depot.constants.DepotConstants;
import com.liferay.depot.model.DepotEntry;
import com.liferay.depot.service.DepotEntryLocalService;
import com.liferay.fragment.model.FragmentEntryLink;
import com.liferay.fragment.service.FragmentEntryLinkLocalServiceUtil;
import com.liferay.layout.page.template.model.LayoutPageTemplateEntry;
import com.liferay.layout.page.template.model.LayoutPageTemplateStructure;
import com.liferay.layout.page.template.service.LayoutPageTemplateEntryLocalService;
import com.liferay.layout.page.template.service.LayoutPageTemplateStructureLocalService;
import com.liferay.layout.test.util.ContentLayoutTestUtil;
import com.liferay.layout.test.util.LayoutTestUtil;
import com.liferay.layout.util.structure.FragmentStyledLayoutStructureItem;
import com.liferay.layout.util.structure.LayoutStructure;
import com.liferay.layout.util.structure.LayoutStructureItem;
import com.liferay.object.constants.ObjectDefinitionConstants;
import com.liferay.object.constants.ObjectDefinitionSettingConstants;
import com.liferay.object.constants.ObjectFieldConstants;
import com.liferay.object.constants.ObjectRelationshipConstants;
import com.liferay.object.field.util.ObjectFieldUtil;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.model.ObjectField;
import com.liferay.object.model.ObjectLayoutBox;
import com.liferay.object.model.ObjectLayoutColumn;
import com.liferay.object.model.ObjectLayoutRow;
import com.liferay.object.model.ObjectLayoutTab;
import com.liferay.object.service.ObjectDefinitionLocalService;
import com.liferay.object.service.ObjectDefinitionSettingLocalService;
import com.liferay.object.service.ObjectFieldLocalService;
import com.liferay.object.service.ObjectLayoutLocalService;
import com.liferay.object.service.ObjectRelationshipLocalService;
import com.liferay.object.service.persistence.ObjectLayoutBoxPersistence;
import com.liferay.object.service.persistence.ObjectLayoutColumnPersistence;
import com.liferay.object.service.persistence.ObjectLayoutRowPersistence;
import com.liferay.object.service.persistence.ObjectLayoutTabPersistence;
import com.liferay.object.test.util.ObjectDefinitionTestUtil;
import com.liferay.object.test.util.ObjectRelationshipTestUtil;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.model.Company;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.GroupConstants;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.service.CompanyLocalService;
import com.liferay.portal.kernel.service.GroupLocalServiceUtil;
import com.liferay.portal.kernel.service.LayoutLocalService;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.service.ServiceContextThreadLocal;
import com.liferay.portal.kernel.struts.StrutsAction;
import com.liferay.portal.kernel.test.rule.AggregateTestRule;
import com.liferay.portal.kernel.test.util.CompanyTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.test.util.ServiceContextTestUtil;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.kernel.util.ListUtil;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.test.rule.FeatureFlag;
import com.liferay.portal.test.rule.Inject;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;
import com.liferay.portal.test.rule.PermissionCheckerMethodTestRule;
import com.liferay.segments.service.SegmentsExperienceLocalService;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * Scratch harness: feed a simple JSON layout, print the generated form
 * structure + rendered HTML. Not meant to be kept.
 *
 * @author Stefano Motta
 */
@FeatureFlag("LPD-17564")
@RunWith(Arquillian.class)
public class ObjectLayoutFormRenderTest {

	@ClassRule
	@Rule
	public static final AggregateTestRule aggregateTestRule =
		new AggregateTestRule(
			new LiferayIntegrationTestRule(),
			PermissionCheckerMethodTestRule.INSTANCE);

	@BeforeClass
	public static void setUpClass() throws Exception {
		_company = CompanyTestUtil.addCompany();

		GroupLocalServiceUtil.checkSystemGroups(_company.getCompanyId());
	}

	@AfterClass
	public static void tearDownClass() throws Exception {
		_companyLocalService.deleteCompany(_company);
	}

	@Before
	public void setUp() throws Exception {
		_depotEntry = _depotEntryLocalService.addDepotEntry(
			HashMapBuilder.put(
				LocaleUtil.getDefault(), RandomTestUtil.randomString()
			).build(),
			HashMapBuilder.put(
				LocaleUtil.getDefault(), RandomTestUtil.randomString()
			).build(),
			DepotConstants.TYPE_ASSET_LIBRARY,
			ServiceContextTestUtil.getServiceContext());

		_group = GroupLocalServiceUtil.getGroup(
			_company.getCompanyId(), GroupConstants.CMS);

		_layout = LayoutTestUtil.addTypeContentLayout(_group);
	}

	@Test
	public void testRenderScenarios() throws Exception {
		for (String[] scenario : _SCENARIOS) {
			System.out.println(
				"\n==================== " + scenario[0] +
					" ====================");

			_render(scenario[1]);
		}
	}

	private void _addObjectLayout(
			ObjectDefinition objectDefinition, String json)
		throws Exception {

		JSONObject jsonObject = JSONFactoryUtil.createJSONObject(json);

		List<ObjectLayoutTab> objectLayoutTabs = new ArrayList<>();

		JSONArray tabsJSONArray = jsonObject.getJSONArray("tabs");

		for (int i = 0; i < tabsJSONArray.length(); i++) {
			JSONObject tabJSONObject = tabsJSONArray.getJSONObject(i);

			ObjectLayoutTab objectLayoutTab =
				_objectLayoutTabPersistence.create(0L);

			objectLayoutTab.setNameMap(
				_toNameMap(tabJSONObject.getString("name")));
			objectLayoutTab.setPriority(i);

			List<ObjectLayoutBox> objectLayoutBoxes = new ArrayList<>();

			JSONArray boxesJSONArray = tabJSONObject.getJSONArray("boxes");

			for (int j = 0; j < boxesJSONArray.length(); j++) {
				JSONObject boxJSONObject = boxesJSONArray.getJSONObject(j);

				ObjectLayoutBox objectLayoutBox =
					_objectLayoutBoxPersistence.create(0L);

				objectLayoutBox.setCollapsable(
					boxJSONObject.getBoolean("collapsable"));
				objectLayoutBox.setNameMap(
					_toNameMap(boxJSONObject.getString("name")),
					LocaleUtil.getDefault());
				objectLayoutBox.setPriority(j);
				objectLayoutBox.setType("regular");
				objectLayoutBox.setObjectLayoutRows(
					_toObjectLayoutRows(
						objectDefinition,
						boxJSONObject.getJSONArray("fields")));

				objectLayoutBoxes.add(objectLayoutBox);
			}

			objectLayoutTab.setObjectLayoutBoxes(objectLayoutBoxes);

			objectLayoutTabs.add(objectLayoutTab);
		}

		_objectLayoutLocalService.addObjectLayout(
			objectDefinition.getUserId(),
			objectDefinition.getObjectDefinitionId(), true,
			_toNameMap("Layout"), objectLayoutTabs);
	}

	private void _printLayoutStructureItem(
		LayoutStructure layoutStructure, String itemId, int depth) {

		if (itemId == null) {
			itemId = layoutStructure.getMainItemId();
		}

		LayoutStructureItem layoutStructureItem =
			layoutStructure.getLayoutStructureItem(itemId);

		if (layoutStructureItem == null) {
			return;
		}

		StringBuilder sb = new StringBuilder();

		for (int i = 0; i < depth; i++) {
			sb.append("  ");
		}

		sb.append("- ");
		sb.append(layoutStructureItem.getItemType());

		if (layoutStructureItem instanceof FragmentStyledLayoutStructureItem) {
			FragmentEntryLink fragmentEntryLink =
				FragmentEntryLinkLocalServiceUtil.fetchFragmentEntryLink(
					((FragmentStyledLayoutStructureItem)layoutStructureItem).
						getFragmentEntryLinkId());

			if (fragmentEntryLink != null) {
				sb.append(" [");
				sb.append(fragmentEntryLink.getRendererKey());
				sb.append("]");
			}
		}

		System.out.println(sb.toString());

		for (String childItemId : layoutStructureItem.getChildrenItemIds()) {
			_printLayoutStructureItem(layoutStructure, childItemId, depth + 1);
		}
	}

	private ObjectDefinition _publishObjectDefinition() throws Exception {
		ObjectDefinition objectDefinition =
			ObjectDefinitionTestUtil.publishObjectDefinition(
				ListUtil.fromArray(
					ObjectFieldUtil.createObjectField(
						ObjectFieldConstants.BUSINESS_TYPE_TEXT,
						ObjectFieldConstants.DB_TYPE_STRING, "Field 1",
						"field1"),
					ObjectFieldUtil.createObjectField(
						ObjectFieldConstants.BUSINESS_TYPE_TEXT,
						ObjectFieldConstants.DB_TYPE_STRING, "Field 2",
						"field2"),
					ObjectFieldUtil.createObjectField(
						ObjectFieldConstants.BUSINESS_TYPE_TEXT,
						ObjectFieldConstants.DB_TYPE_STRING, "Field 3",
						"field3"),
					ObjectFieldUtil.createObjectField(
						ObjectFieldConstants.BUSINESS_TYPE_TEXT,
						ObjectFieldConstants.DB_TYPE_STRING, "Field 4",
						"field4")),
				ObjectDefinitionConstants.SCOPE_DEPOT);

		_objectDefinitionSettingLocalService.addObjectDefinitionSetting(
			objectDefinition.getUserId(),
			objectDefinition.getObjectDefinitionId(),
			ObjectDefinitionSettingConstants.NAME_ACCEPT_ALL_GROUPS,
			StringPool.TRUE);

		objectDefinition.setEnableObjectEntryDraft(true);

		objectDefinition = _objectDefinitionLocalService.updateObjectDefinition(
			objectDefinition);

		// Related content: a non-edge oneToMany relationship makes the main
		// definition the child, so it gets a Relationship object field.

		ObjectDefinition relatedObjectDefinition =
			ObjectDefinitionTestUtil.publishObjectDefinition(
				ListUtil.fromArray(
					ObjectFieldUtil.createObjectField(
						ObjectFieldConstants.BUSINESS_TYPE_TEXT,
						ObjectFieldConstants.DB_TYPE_STRING, "Name", "name")),
				ObjectDefinitionConstants.SCOPE_DEPOT);

		ObjectRelationshipTestUtil.addObjectRelationship(
			_objectRelationshipLocalService, relatedObjectDefinition,
			objectDefinition);

		_relatedFieldName = null;

		for (ObjectField objectField :
				_objectFieldLocalService.getObjectFields(
					objectDefinition.getObjectDefinitionId())) {

			if (ObjectFieldConstants.BUSINESS_TYPE_RELATIONSHIP.equals(
					objectField.getBusinessType())) {

				_relatedFieldName = objectField.getName();

				break;
			}
		}

		// Edge relationship (repeatable-group-like): main is the parent side.

		ObjectDefinition childObjectDefinition =
			ObjectDefinitionTestUtil.publishObjectDefinition(
				ListUtil.fromArray(
					ObjectFieldUtil.createObjectField(
						ObjectFieldConstants.BUSINESS_TYPE_TEXT,
						ObjectFieldConstants.DB_TYPE_STRING, "Child", "child")),
				ObjectDefinitionConstants.SCOPE_DEPOT);

		_objectRelationshipLocalService.addObjectRelationship(
			null, objectDefinition.getUserId(),
			objectDefinition.getObjectDefinitionId(),
			childObjectDefinition.getObjectDefinitionId(), 0,
			ObjectRelationshipConstants.DELETION_TYPE_CASCADE, true,
			_toNameMap("Edge Group"), "edgeGroup", false,
			ObjectRelationshipConstants.TYPE_ONE_TO_MANY, null);

		return objectDefinition;
	}

	private void _render(String json) throws Exception {
		ObjectDefinition objectDefinition = _publishObjectDefinition();

		if (!json.isEmpty()) {
			_addObjectLayout(
				objectDefinition,
				json.replace("__RELATED__", _relatedFieldName));
		}

		long classNameId = _portal.getClassNameId(
			objectDefinition.getClassName());

		MockHttpServletRequest mockHttpServletRequest =
			ContentLayoutTestUtil.getMockHttpServletRequest(
				_companyLocalService.getCompany(_company.getCompanyId()),
				_group, _layout);

		mockHttpServletRequest.setParameter(
			"groupId", String.valueOf(_depotEntry.getGroupId()));
		mockHttpServletRequest.setParameter(
			"objectDefinitionId",
			String.valueOf(objectDefinition.getObjectDefinitionId()));
		mockHttpServletRequest.setParameter(
			"plid", String.valueOf(_layout.getPlid()));
		mockHttpServletRequest.setRequestURI(_layout.getFriendlyURL());

		MockHttpServletResponse mockHttpServletResponse =
			new MockHttpServletResponse();

		ThemeDisplay themeDisplay =
			(ThemeDisplay)mockHttpServletRequest.getAttribute(
				WebKeys.THEME_DISPLAY);

		themeDisplay.setRequest(mockHttpServletRequest);
		themeDisplay.setResponse(mockHttpServletResponse);

		ServiceContext serviceContext = ServiceContextFactory.getInstance(
			mockHttpServletRequest);

		ServiceContextThreadLocal.pushServiceContext(serviceContext);

		try {
			_addStructuredContentItemStrutsAction.execute(
				mockHttpServletRequest, mockHttpServletResponse);

			LayoutPageTemplateEntry layoutPageTemplateEntry =
				_layoutPageTemplateEntryLocalService.
					fetchDefaultLayoutPageTemplateEntry(
						_group.getGroupId(), classNameId, 0);

			Layout draftLayout = _layoutLocalService.fetchDraftLayout(
				layoutPageTemplateEntry.getPlid());

			long segmentsExperienceId =
				_segmentsExperienceLocalService.
					fetchDefaultSegmentsExperienceId(draftLayout.getPlid());

			LayoutPageTemplateStructure layoutPageTemplateStructure =
				_layoutPageTemplateStructureLocalService.
					fetchLayoutPageTemplateStructure(
						draftLayout.getGroupId(), draftLayout.getPlid());

			String data = layoutPageTemplateStructure.getData(
				segmentsExperienceId);

			System.out.println("----- STRUCTURE -----");
			System.out.println(data);

			System.out.println("----- TREE -----");
			_printLayoutStructureItem(LayoutStructure.of(data), null, 0);
		}
		finally {
			ServiceContextThreadLocal.popServiceContext();
		}
	}

	private Map<Locale, String> _toNameMap(String name) {
		return HashMapBuilder.put(
			LocaleUtil.getDefault(), name
		).build();
	}

	private List<ObjectLayoutRow> _toObjectLayoutRows(
		ObjectDefinition objectDefinition, JSONArray fieldsJSONArray) {

		List<ObjectLayoutRow> objectLayoutRows = new ArrayList<>();

		if (fieldsJSONArray == null) {
			return objectLayoutRows;
		}

		for (int i = 0; i < fieldsJSONArray.length(); i++) {
			ObjectField objectField = _objectFieldLocalService.fetchObjectField(
				objectDefinition.getObjectDefinitionId(),
				fieldsJSONArray.getString(i));

			if (objectField == null) {
				continue;
			}

			ObjectLayoutColumn objectLayoutColumn =
				_objectLayoutColumnPersistence.create(0L);

			objectLayoutColumn.setObjectFieldId(objectField.getObjectFieldId());
			objectLayoutColumn.setPriority(0);
			objectLayoutColumn.setSize(12);

			ObjectLayoutRow objectLayoutRow =
				_objectLayoutRowPersistence.create(0L);

			objectLayoutRow.setPriority(i);
			objectLayoutRow.setObjectLayoutColumns(
				ListUtil.fromArray(objectLayoutColumn));

			objectLayoutRows.add(objectLayoutRow);
		}

		return objectLayoutRows;
	}

	private static final String[][] _SCENARIOS = {
		{"0) FLAT (no layout)", ""},
		{
			"1) field field field",
			"{\"tabs\":[{\"name\":\"General\",\"boxes\":[" +
				"{\"name\":\"\",\"collapsable\":false,\"fields\":" +
					"[\"field1\",\"field2\",\"field3\"]}]}]}"
		},
		{
			"2) field group(field field)",
			"{\"tabs\":[{\"name\":\"General\",\"boxes\":[" +
				"{\"name\":\"\",\"collapsable\":false,\"fields\":[\"field1\"]}," +
					"{\"name\":\"Group 1\",\"collapsable\":true,\"fields\":" +
						"[\"field2\",\"field3\"]}]}]}"
		},
		{
			"3) group(field field) group(field)",
			"{\"tabs\":[{\"name\":\"General\",\"boxes\":[" +
				"{\"name\":\"Group 1\",\"collapsable\":true,\"fields\":" +
					"[\"field1\",\"field2\"]}," +
						"{\"name\":\"Group 2\",\"collapsable\":true,\"fields\":" +
							"[\"field3\"]}]}]}"
		},
		{
			"4) tab(field field)",
			"{\"tabs\":[{\"name\":\"Tab 1\",\"boxes\":[" +
				"{\"name\":\"\",\"collapsable\":false,\"fields\":" +
					"[\"field1\",\"field2\"]}]}]}"
		},
		{
			"5) tab(field field) tab(field)",
			"{\"tabs\":[" + "{\"name\":\"Tab 1\",\"boxes\":[{\"name\":\"\"," +
				"\"collapsable\":false,\"fields\":[\"field1\",\"field2\"]}]}," +
					"{\"name\":\"Tab 2\",\"boxes\":[{\"name\":\"\"," +
						"\"collapsable\":false,\"fields\":[\"field3\"]}]}]}"
		},
		{
			"6) tab(group(field))",
			"{\"tabs\":[{\"name\":\"Tab 1\",\"boxes\":[" +
				"{\"name\":\"Group 1\",\"collapsable\":true,\"fields\":" +
					"[\"field1\"]}]}]}"
		},
		{
			"7) tab(group(field)) tab(field)",
			"{\"tabs\":[" +
				"{\"name\":\"Tab 1\",\"boxes\":[{\"name\":\"Group 1\"," +
					"\"collapsable\":true,\"fields\":[\"field1\"]}]}," +
						"{\"name\":\"Tab 2\",\"boxes\":[{\"name\":\"\"," +
							"\"collapsable\":false,\"fields\":[\"field2\"]}]}]}"
		},
		{
			"8) tab(group(field)) tab(group(field))",
			"{\"tabs\":[" +
				"{\"name\":\"Tab 1\",\"boxes\":[{\"name\":\"Group 1\"," +
					"\"collapsable\":true,\"fields\":[\"field1\"]}]}," +
						"{\"name\":\"Tab 2\",\"boxes\":[{\"name\":\"Group 2\"," +
							"\"collapsable\":true,\"fields\":[\"field2\"]}]}]}"
		},
		{
			"9) field group(field) tab(field)",
			"{\"tabs\":[" + "{\"name\":\"General\",\"boxes\":[" +
				"{\"name\":\"\",\"collapsable\":false,\"fields\":" +
					"[\"field1\"]}," +
						"{\"name\":\"Group 1\",\"collapsable\":true,\"fields\":" +
							"[\"field2\"]}]}," +
								"{\"name\":\"Details\",\"boxes\":[{\"name\":\"\"," +
									"\"collapsable\":false,\"fields\":[\"field3\"]}]}]}"
		},
		{
			"10) field tab(field) field (loose fields -> General)",
			"{\"tabs\":[" + "{\"name\":\"General\",\"boxes\":[{\"name\":\"\"," +
				"\"collapsable\":false,\"fields\":" +
					"[\"field1\",\"field3\"]}]}," +
						"{\"name\":\"Details\",\"boxes\":[{\"name\":\"\"," +
							"\"collapsable\":false,\"fields\":[\"field2\"]}]}]}"
		},
		{
			"11) related (single field)",
			"{\"tabs\":[{\"name\":\"General\",\"boxes\":[{\"name\":\"\"," +
				"\"collapsable\":false,\"fields\":[\"__RELATED__\"]}]}]}"
		},
		{
			"12) group(related)",
			"{\"tabs\":[{\"name\":\"General\",\"boxes\":[" +
				"{\"name\":\"Related\",\"collapsable\":true,\"fields\":" +
					"[\"__RELATED__\"]}]}]}"
		},
		{
			"13) tab(related)",
			"{\"tabs\":[{\"name\":\"Tab 1\",\"boxes\":[{\"name\":\"\"," +
				"\"collapsable\":false,\"fields\":[\"__RELATED__\"]}]}]}"
		},
		{
			"14) tab(group(related))",
			"{\"tabs\":[{\"name\":\"Tab 1\",\"boxes\":[" +
				"{\"name\":\"Related\",\"collapsable\":true,\"fields\":" +
					"[\"__RELATED__\"]}]}]}"
		},
		{
			"15) repeatable-group (single)",
			"{\"tabs\":[{\"name\":\"General\",\"boxes\":[" +
				"{\"name\":\"rep-group-edgeGroup\",\"collapsable\":false," +
					"\"fields\":[]}]}]}"
		},
		{
			"16) field + repeatable-group",
			"{\"tabs\":[{\"name\":\"General\",\"boxes\":[" +
				"{\"name\":\"\",\"collapsable\":false,\"fields\":[\"field1\"]}," +
					"{\"name\":\"rep-group-edgeGroup\",\"collapsable\":false," +
						"\"fields\":[]}]}]}"
		},
		{
			"17) tab(repeatable-group)",
			"{\"tabs\":[{\"name\":\"Tab 1\",\"boxes\":[" +
				"{\"name\":\"rep-group-edgeGroup\",\"collapsable\":false," +
					"\"fields\":[]}]}]}"
		}
	};

	private static Company _company;

	@Inject
	private static CompanyLocalService _companyLocalService;

	@Inject(filter = "path=/cms/add_structured_content_item")
	private StrutsAction _addStructuredContentItemStrutsAction;

	private DepotEntry _depotEntry;

	@Inject
	private DepotEntryLocalService _depotEntryLocalService;

	private Group _group;
	private Layout _layout;

	@Inject
	private LayoutLocalService _layoutLocalService;

	@Inject
	private LayoutPageTemplateEntryLocalService
		_layoutPageTemplateEntryLocalService;

	@Inject
	private LayoutPageTemplateStructureLocalService
		_layoutPageTemplateStructureLocalService;

	@Inject
	private ObjectDefinitionLocalService _objectDefinitionLocalService;

	@Inject
	private ObjectDefinitionSettingLocalService
		_objectDefinitionSettingLocalService;

	@Inject
	private ObjectFieldLocalService _objectFieldLocalService;

	@Inject
	private ObjectLayoutBoxPersistence _objectLayoutBoxPersistence;

	@Inject
	private ObjectLayoutColumnPersistence _objectLayoutColumnPersistence;

	@Inject
	private ObjectLayoutLocalService _objectLayoutLocalService;

	@Inject
	private ObjectLayoutRowPersistence _objectLayoutRowPersistence;

	@Inject
	private ObjectLayoutTabPersistence _objectLayoutTabPersistence;

	@Inject
	private ObjectRelationshipLocalService _objectRelationshipLocalService;

	@Inject
	private Portal _portal;

	private String _relatedFieldName;

	@Inject
	private SegmentsExperienceLocalService _segmentsExperienceLocalService;

}