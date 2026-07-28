/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.site.pim.site.initializer.internal.servlet.taglib;

import com.liferay.portal.kernel.servlet.taglib.DynamicInclude;
import com.liferay.site.cms.site.initializer.constants.CMSStructureBuilderConstants;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;

import org.osgi.service.component.annotations.Component;

/**
 * @author Stefano Motta
 */
@Component(service = DynamicInclude.class)
public class PIMStructureBuilderDynamicInclude implements DynamicInclude {

	@Override
	public void include(
			HttpServletRequest httpServletRequest,
			HttpServletResponse httpServletResponse, String key)
		throws IOException {

		PrintWriter printWriter = httpServletResponse.getWriter();

		printWriter.write("<script type=\"module\">import('");
		printWriter.write(_CONTRIBUTOR_MODULE_URL);
		printWriter.write(
			"').then(function(module){" +
				"module.registerStructureBuilderContributor();});</script>");
	}

	@Override
	public void register(DynamicIncludeRegistry dynamicIncludeRegistry) {
		dynamicIncludeRegistry.register(
			CMSStructureBuilderConstants.CONTRIBUTORS_DYNAMIC_INCLUDE_KEY);
	}

	private static final String _CONTRIBUTOR_MODULE_URL =
		"/o/site-pim-site-initializer/__liferay__/index.js";

}