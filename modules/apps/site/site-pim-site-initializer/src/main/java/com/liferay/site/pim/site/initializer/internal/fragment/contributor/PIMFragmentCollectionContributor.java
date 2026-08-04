/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.site.pim.site.initializer.internal.fragment.contributor;

import com.liferay.fragment.contributor.BaseFragmentCollectionContributor;
import com.liferay.fragment.contributor.FragmentCollectionContributor;

import jakarta.servlet.ServletContext;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Stefano Motta
 */
@Component(
	property = "fragment.collection.key=PIM",
	service = FragmentCollectionContributor.class
)
public class PIMFragmentCollectionContributor
	extends BaseFragmentCollectionContributor {

	@Override
	public String getFragmentCollectionKey() {
		return "PIM";
	}

	@Override
	public ServletContext getServletContext() {
		return _servletContext;
	}

	@Reference(
		target = "(osgi.web.symbolicname=com.liferay.site.pim.site.initializer)"
	)
	private ServletContext _servletContext;

}