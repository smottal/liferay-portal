/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.commerce.internal.search.spi.model.permission;

import com.liferay.commerce.constants.CommerceOrderConstants;
import com.liferay.commerce.model.CommerceOrder;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.service.ObjectDefinitionLocalService;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.search.BooleanClauseOccur;
import com.liferay.portal.kernel.search.filter.BooleanFilter;
import com.liferay.portal.kernel.search.filter.TermsFilter;
import com.liferay.portal.kernel.security.permission.ActionKeys;
import com.liferay.portal.kernel.security.permission.PermissionChecker;
import com.liferay.portal.kernel.security.permission.resource.ModelResourcePermission;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextThreadLocal;
import com.liferay.portal.kernel.util.GetterUtil;
import com.liferay.portal.kernel.util.StringUtil;
import com.liferay.portal.search.spi.model.permission.contributor.SearchPermissionFilterContributor;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Stefano Motta
 */
@Component(service = SearchPermissionFilterContributor.class)
public class CommerceOrderAttachmentSearchPermissionFilterContributor
	implements SearchPermissionFilterContributor {

	@Override
	public void contribute(
		BooleanFilter booleanFilter, long companyId, long[] groupIds,
		long userId, PermissionChecker permissionChecker, String className) {

		ObjectDefinition objectDefinition =
			_objectDefinitionLocalService.
				fetchObjectDefinitionByExternalReferenceCode(
					"L_COMMERCE_ORDER_ATTACHMENT", companyId);

		if ((objectDefinition == null) ||
			!className.equals(objectDefinition.getClassName()) ||
			!StringUtil.equals(
				objectDefinition.getScope(),
				CommerceOrderConstants.OBJECT_DEFINITION_SCOPE)) {

			return;
		}

		TermsFilter termsFilter = new TermsFilter(
			"r_commerceOrderToCommerceOrderAttachments_commerceOrderId");

		long commerceOrderId = _getCommerceOrderId();

		if ((commerceOrderId > 0) &&
			_hasViewPermission(permissionChecker, commerceOrderId)) {

			termsFilter.addValue(String.valueOf(commerceOrderId));
		}
		else {
			termsFilter.addValue("0");
		}

		booleanFilter.add(termsFilter, BooleanClauseOccur.MUST);
	}

	private long _getCommerceOrderId() {
		ServiceContext serviceContext =
			ServiceContextThreadLocal.getServiceContext();

		if (serviceContext == null) {
			return 0;
		}

		long commerceOrderId = GetterUtil.getLong(
			serviceContext.getAttribute("commerceOrderId"));

		if (commerceOrderId > 0) {
			return commerceOrderId;
		}

		return GetterUtil.getLong(serviceContext.getAttribute("scopeKey"));
	}

	private boolean _hasViewPermission(
		PermissionChecker permissionChecker, long commerceOrderId) {

		try {
			return _commerceOrderModelResourcePermission.contains(
				permissionChecker, commerceOrderId, ActionKeys.VIEW);
		}
		catch (PortalException portalException) {
			if (_log.isWarnEnabled()) {
				_log.warn(portalException);
			}

			return false;
		}
	}

	private static final Log _log = LogFactoryUtil.getLog(
		CommerceOrderAttachmentSearchPermissionFilterContributor.class);

	@Reference(
		target = "(model.class.name=com.liferay.commerce.model.CommerceOrder)"
	)
	private ModelResourcePermission<CommerceOrder>
		_commerceOrderModelResourcePermission;

	@Reference
	private ObjectDefinitionLocalService _objectDefinitionLocalService;

}