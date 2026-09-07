/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.site.pim.site.initializer.internal.connector;

import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.site.pim.site.initializer.connector.PIMConnector;
import com.liferay.site.pim.site.initializer.connector.PIMConnectorField;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import org.osgi.service.component.annotations.Component;

/**
 * @author Andrea Sbarra
 */
@Component(service = PIMConnector.class)
public class LiferayCommercePIMConnector implements PIMConnector {

	public static final String KEY = "liferay-commerce";

	@Override
	public String getKey() {
		return KEY;
	}

	@Override
	public String getName(Locale locale) {
		return LanguageUtil.get(locale, KEY);
	}

	@Override
	public List<PIMConnectorField> getPIMConnectorFields(Locale locale) {
		return Arrays.asList(
			new PIMConnectorField(
				LanguageUtil.get(locale, "active"), "active", true,
				LanguageUtil.get(locale, "boolean")),
			new PIMConnectorField(
				LanguageUtil.get(locale, "description"), "description", false,
				LanguageUtil.get(locale, "localized-text")),
			new PIMConnectorField(
				LanguageUtil.get(locale, "external-reference-code"),
				"externalReferenceCode", false,
				LanguageUtil.get(locale, "text")),
			new PIMConnectorField(
				LanguageUtil.get(locale, "name"), "name", true,
				LanguageUtil.get(locale, "localized-text")),
			new PIMConnectorField(
				LanguageUtil.get(locale, "product-type"), "productType", true,
				LanguageUtil.get(locale, "text")),
			new PIMConnectorField(
				LanguageUtil.get(locale, "sku"), "skus[].sku", false,
				LanguageUtil.get(locale, "text")));
	}

	@Override
	public boolean isActive(long companyId) {
		return true;
	}

}