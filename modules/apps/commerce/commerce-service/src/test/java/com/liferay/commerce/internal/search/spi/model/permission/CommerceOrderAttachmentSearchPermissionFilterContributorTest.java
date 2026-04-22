/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.commerce.internal.search.spi.model.permission;

import com.liferay.commerce.constants.CommerceOrderConstants;
import com.liferay.commerce.model.CommerceOrder;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.service.ObjectDefinitionLocalService;
import com.liferay.portal.kernel.search.BooleanClause;
import com.liferay.portal.kernel.search.filter.BooleanFilter;
import com.liferay.portal.kernel.search.filter.Filter;
import com.liferay.portal.kernel.search.filter.TermsFilter;
import com.liferay.portal.kernel.security.permission.ActionKeys;
import com.liferay.portal.kernel.security.permission.PermissionChecker;
import com.liferay.portal.kernel.security.permission.resource.ModelResourcePermission;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextThreadLocal;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.test.rule.LiferayUnitTestRule;

import java.util.List;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

/**
 * @author Stefano Motta
 */
public class CommerceOrderAttachmentSearchPermissionFilterContributorTest {

	@ClassRule
	@Rule
	public static final LiferayUnitTestRule liferayUnitTestRule =
		LiferayUnitTestRule.INSTANCE;

	@Before
	public void setUp() {
		MockitoAnnotations.initMocks(this);

		Mockito.when(
			_objectDefinition.getClassName()
		).thenReturn(
			_OBJECT_DEFINITION_CLASS_NAME
		);
	}

	@After
	public void tearDown() {
		ServiceContextThreadLocal.popServiceContext();
	}

	@Test
	public void testContribute() throws Exception {
		long companyId = RandomTestUtil.randomLong();

		Mockito.when(
			_objectDefinitionLocalService.
				fetchObjectDefinitionByExternalReferenceCode(
					"L_COMMERCE_ORDER_ATTACHMENT", companyId)
		).thenReturn(
			null
		);

		BooleanFilter booleanFilter = new BooleanFilter();

		_contributor.contribute(
			booleanFilter, companyId, new long[0], RandomTestUtil.randomLong(),
			_permissionChecker, _OBJECT_DEFINITION_CLASS_NAME);

		List<BooleanClause<Filter>> mustBooleanClauses =
			booleanFilter.getMustBooleanClauses();

		Assert.assertTrue(mustBooleanClauses.isEmpty());

		Mockito.when(
			_objectDefinitionLocalService.
				fetchObjectDefinitionByExternalReferenceCode(
					"L_COMMERCE_ORDER_ATTACHMENT", companyId)
		).thenReturn(
			_objectDefinition
		);

		booleanFilter = new BooleanFilter();

		_contributor.contribute(
			booleanFilter, companyId, new long[0], RandomTestUtil.randomLong(),
			_permissionChecker, "com.liferay.some.other.Class");

		mustBooleanClauses = booleanFilter.getMustBooleanClauses();

		Assert.assertTrue(mustBooleanClauses.isEmpty());

		Mockito.when(
			_objectDefinition.getScope()
		).thenReturn(
			RandomTestUtil.randomString()
		);

		booleanFilter = new BooleanFilter();

		_contributor.contribute(
			booleanFilter, companyId, new long[0], RandomTestUtil.randomLong(),
			_permissionChecker, _OBJECT_DEFINITION_CLASS_NAME);

		mustBooleanClauses = booleanFilter.getMustBooleanClauses();

		Assert.assertTrue(mustBooleanClauses.isEmpty());

		Mockito.when(
			_objectDefinition.getScope()
		).thenReturn(
			CommerceOrderConstants.OBJECT_DEFINITION_SCOPE
		);

		booleanFilter = new BooleanFilter();

		_contributor.contribute(
			booleanFilter, companyId, new long[0], RandomTestUtil.randomLong(),
			_permissionChecker, _OBJECT_DEFINITION_CLASS_NAME);

		_assertEquals(booleanFilter, "0");

		long commerceOrderId = RandomTestUtil.randomLong();

		ServiceContext serviceContext = new ServiceContext();

		serviceContext.setAttribute("commerceOrderId", commerceOrderId);

		ServiceContextThreadLocal.pushServiceContext(serviceContext);

		Mockito.when(
			_commerceOrderModelResourcePermission.contains(
				_permissionChecker, commerceOrderId, ActionKeys.VIEW)
		).thenReturn(
			false
		);

		booleanFilter = new BooleanFilter();

		_contributor.contribute(
			booleanFilter, companyId, new long[0], RandomTestUtil.randomLong(),
			_permissionChecker, _OBJECT_DEFINITION_CLASS_NAME);

		_assertEquals(booleanFilter, "0");

		Mockito.when(
			_commerceOrderModelResourcePermission.contains(
				_permissionChecker, commerceOrderId, ActionKeys.VIEW)
		).thenReturn(
			true
		);

		booleanFilter = new BooleanFilter();

		_contributor.contribute(
			booleanFilter, companyId, new long[0], RandomTestUtil.randomLong(),
			_permissionChecker, _OBJECT_DEFINITION_CLASS_NAME);

		_assertEquals(booleanFilter, String.valueOf(commerceOrderId));
	}

	private void _assertEquals(BooleanFilter booleanFilter, String value) {
		List<BooleanClause<Filter>> clauses =
			booleanFilter.getMustBooleanClauses();

		Assert.assertEquals(clauses.toString(), 1, clauses.size());

		BooleanClause<Filter> filterBooleanClause = clauses.get(0);

		TermsFilter termsFilter = (TermsFilter)filterBooleanClause.getClause();

		Assert.assertEquals(
			"r_commerceOrderToCommerceOrderAttachments_commerceOrderId",
			termsFilter.getField());
		Assert.assertArrayEquals(new String[] {value}, termsFilter.getValues());
	}

	private static final String _OBJECT_DEFINITION_CLASS_NAME =
		RandomTestUtil.randomString();

	@Mock
	private ModelResourcePermission<CommerceOrder>
		_commerceOrderModelResourcePermission;

	@InjectMocks
	private CommerceOrderAttachmentSearchPermissionFilterContributor
		_contributor;

	@Mock
	private ObjectDefinition _objectDefinition;

	@Mock
	private ObjectDefinitionLocalService _objectDefinitionLocalService;

	@Mock
	private PermissionChecker _permissionChecker;

}