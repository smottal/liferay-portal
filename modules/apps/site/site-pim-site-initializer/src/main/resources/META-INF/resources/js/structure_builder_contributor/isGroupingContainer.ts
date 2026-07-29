/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {StructureChild} from '@liferay/site-cms-site-initializer';

export default function isGroupingContainer(child: {
	type: StructureChild['type'];
}): boolean {
	return child.type === 'grouping-container';
}
