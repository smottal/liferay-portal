/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.marketplace.store.web.internal.portlet;

import com.liferay.marketplace.constants.MarketplaceAppsPortletKeys;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCPortlet;
import org.osgi.service.component.annotations.Component;

import javax.portlet.Portlet;

/**
 * @author Stefano Motta
 */
@Component(
	property = {
		"javax.portlet.description=", "javax.portlet.display-name=Payment Methods",
		"javax.portlet.name=" + MarketplaceAppsPortletKeys.MARKETPLACE_APPS_PAYMENT_METHODS,
		"javax.portlet.resource-bundle=content.Language",
		"javax.portlet.security-role-ref=administrator",
		"javax.portlet.version=3.0"
	},
	service = Portlet.class
)
public class MarketplaceAppsPaymentMethodsPortlet extends MVCPortlet {

}