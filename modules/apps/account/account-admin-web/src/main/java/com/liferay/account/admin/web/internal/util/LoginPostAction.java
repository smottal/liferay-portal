/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.account.admin.web.internal.util;

import com.liferay.petra.function.transform.TransformUtil;
import com.liferay.portal.kernel.events.Action;
import com.liferay.portal.kernel.events.LifecycleAction;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.Role;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.search.BooleanClause;
import com.liferay.portal.kernel.search.BooleanClauseFactoryUtil;
import com.liferay.portal.kernel.search.BooleanClauseOccur;
import com.liferay.portal.kernel.search.Field;
import com.liferay.portal.kernel.search.Hits;
import com.liferay.portal.kernel.search.Indexer;
import com.liferay.portal.kernel.search.IndexerRegistry;
import com.liferay.portal.kernel.search.SearchContext;
import com.liferay.portal.kernel.search.filter.BooleanFilter;
import com.liferay.portal.kernel.search.filter.ExistsFilter;
import com.liferay.portal.kernel.search.filter.TermsFilter;
import com.liferay.portal.kernel.search.generic.BooleanQueryImpl;
import com.liferay.portal.kernel.service.RoleLocalService;
import com.liferay.portal.kernel.util.Portal;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Stefano Motta
 */
@Component(property = "key=login.events.post", service = LifecycleAction.class)
public class LoginPostAction extends Action {

	@Override
	public void run(
		HttpServletRequest httpServletRequest,
		HttpServletResponse httpServletResponse) {

		try {
			_run(httpServletRequest, httpServletResponse);
		}
		catch (Exception exception) {
			if (_log.isDebugEnabled()) {
				_log.debug(exception);
			}
		}
	}

	private BooleanFilter _addFilter(String fieldName, String value) {
		BooleanFilter booleanFilter1 = new BooleanFilter();

		BooleanFilter booleanFilter2 = new BooleanFilter();

		// specific user value
		booleanFilter2.add(
			new TermsFilter(fieldName) {
				{
					addValues(value);
				}
			},
			BooleanClauseOccur.MUST);

		booleanFilter1.add(booleanFilter2, BooleanClauseOccur.SHOULD);

		// or the role is valid for any value (empty)
		booleanFilter2 = new BooleanFilter();

		booleanFilter2.add(
			new ExistsFilter(fieldName), BooleanClauseOccur.MUST_NOT);

		booleanFilter1.add(booleanFilter2, BooleanClauseOccur.SHOULD);

		return booleanFilter1;
	}

	// Here we should add all the conditions needed to find the dynamic roles
	// valid for the user parameters
	private BooleanFilter _createFilter(User user) {
		BooleanFilter rootBooleanFilter = new BooleanFilter();

		BooleanFilter booleanFilter = new BooleanFilter();

		booleanFilter.add(
			_addFilter("DYNAMIC_ATTRIBUTE_FIRSTNAME", user.getFirstName()),
			BooleanClauseOccur.MUST);

		booleanFilter.add(
			_addFilter("DYNAMIC_ATTRIBUTE_LASTNAME", user.getLastName()),
			BooleanClauseOccur.MUST);

		rootBooleanFilter.add(booleanFilter, BooleanClauseOccur.MUST);

		return rootBooleanFilter;
	}

	// Here we should find all the dynamic roles and remove them from the user
	private void _resetDynamicRoleIds(long companyId, long userId)
		throws PortalException {

		Role role1 = _roleLocalService.fetchRole(companyId, "Role1");

		if (role1 == null) {
			return;
		}

		Role role2 = _roleLocalService.getRole(companyId, "Role2");
		Role role3 = _roleLocalService.getRole(companyId, "Role3");
		Role role4 = _roleLocalService.getRole(
			companyId, "Role4");

		_roleLocalService.deleteUserRoles(
			userId,
			new long[] {
				role1.getRoleId(), role2.getRoleId(), role3.getRoleId(),
				role4.getRoleId()
			});
	}

	private void _run(
			HttpServletRequest httpServletRequest,
			HttpServletResponse httpServletResponse)
		throws PortalException {

		User user = _portal.getUser(httpServletRequest);

		_resetDynamicRoleIds(user.getCompanyId(), user.getUserId());

		BooleanQueryImpl booleanQueryImpl = new BooleanQueryImpl();

		booleanQueryImpl.setPreBooleanFilter(_createFilter(user));

		BooleanClause booleanClause = BooleanClauseFactoryUtil.create(
			booleanQueryImpl, BooleanClauseOccur.MUST.getName());

		SearchContext searchContext = new SearchContext();

		searchContext.setBooleanClauses(new BooleanClause[] {booleanClause});
		searchContext.setCompanyId(user.getCompanyId());

		Indexer<Role> indexer = _indexerRegistry.getIndexer(Role.class);

		Hits hits = indexer.search(searchContext);

		_roleLocalService.addUserRoles(
			user.getUserId(),
			TransformUtil.transformToLongArray(
				hits.getDocs(), doc -> Long.valueOf(doc.get(Field.ENTRY_CLASS_PK))));
	}

	private static final Log _log = LogFactoryUtil.getLog(
		LoginPostAction.class);

	@Reference
	private IndexerRegistry _indexerRegistry;

	@Reference
	private Portal _portal;

	@Reference
	private RoleLocalService _roleLocalService;

}