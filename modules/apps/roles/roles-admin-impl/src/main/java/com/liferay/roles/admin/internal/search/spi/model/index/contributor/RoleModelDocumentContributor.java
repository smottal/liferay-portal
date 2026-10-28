/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.roles.admin.internal.search.spi.model.index.contributor;

import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.Role;
import com.liferay.portal.kernel.search.Document;
import com.liferay.portal.kernel.search.Field;
import com.liferay.portal.search.spi.model.index.contributor.ModelDocumentContributor;

import org.osgi.service.component.annotations.Component;

/**
 * @author Stefano Motta
 */
@Component(
	property = {
		"indexer.class.name=com.liferay.portal.kernel.model.Role",
		"service.ranking:Integer=200"
	},
	service = ModelDocumentContributor.class
)
public class RoleModelDocumentContributor
	implements ModelDocumentContributor<Role> {

	@Override
	public void contribute(Document document, Role role) {
		try {
			document.addKeyword(Field.COMPANY_ID, role.getCompanyId());
			document.addDate(Field.CREATE_DATE, role.getCreateDate());
			document.addText(Field.DESCRIPTION, role.getDescription());
			document.addDate(Field.MODIFIED_DATE, role.getModifiedDate());
			document.addKeyword(Field.NAME, role.getName());
			document.addText(Field.TITLE, role.getTitle());
			document.addNumber(Field.TYPE, role.getType());
			document.addKeyword(Field.USER_ID, role.getUserId());
			document.addKeyword("accountEntryId", 0);
			document.addKeyword(
				"externalReferenceCode", role.getExternalReferenceCode());
			document.addLocalizedText(
				"localized_description", role.getDescriptionMap());
			document.addLocalizedText("localized_title", role.getTitleMap());
			document.addKeyword("subtype", role.getSubtype());

			String name = role.getName();


			// Here we should retrieve the dynamic role configuration and store
			// it in the role index so we can filter them by these values
			if (name.equals("Role1")) {
				document.addText(
					"DYNAMIC_ATTRIBUTE_LASTNAME", new String[] {"last1"});
				document.addText(
					"DYNAMIC_ATTRIBUTE_FIRSTNAME",
					new String[] {"first1", "first2"});
			}
			else if (name.equals("Role2")) {
				document.addText(
					"DYNAMIC_ATTRIBUTE_LASTNAME", new String[] {"last2"});
				document.addText("DYNAMIC_ATTRIBUTE_FIRSTNAME", new String[0]);
			}
			else if (name.equals("Role3")) {
				document.addText(
					"DYNAMIC_ATTRIBUTE_LASTNAME", new String[] {"last1", "last2", "last3"});
				document.addText("DYNAMIC_ATTRIBUTE_FIRSTNAME", new String[] {"first3"});
			}
			else if (name.equals("Role4")) {
				document.addText("DYNAMIC_ATTRIBUTE_LASTNAME", new String[0]);
				document.addText("DYNAMIC_ATTRIBUTE_FIRSTNAME", new String[0]);
			} else {
				document.addText("DYNAMIC_ATTRIBUTE_LASTNAME", new String[] {"--------"});
				document.addText("DYNAMIC_ATTRIBUTE_FIRSTNAME", new String[] {"--------"});
			}
		}
		catch (Exception exception) {
			if (_log.isWarnEnabled()) {
				_log.warn(
					"Unable to index role " + role.getRoleId(), exception);
			}
		}
	}

	private static final Log _log = LogFactoryUtil.getLog(
		RoleModelDocumentContributor.class);

}