/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	ObjectDefinition,
	ObjectDefinitions,
	Structure,
	Uuid,
	buildChildren,
} from '@liferay/site-cms-site-initializer';

import applyObjectLayout from './applyObjectLayout';

export default function buildTemplateChildren({
	objectDefinition,
	objectDefinitions,
	parent,
}: {
	objectDefinition: ObjectDefinition;
	objectDefinitions: ObjectDefinitions;
	parent: Uuid;
}): Structure['children'] {
	const children = buildChildren({
		objectDefinition,
		objectDefinitions,
		parent,
	});

	return applyObjectLayout({children, objectDefinition, parent});
}
