/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	GroupingContainer,
	StructureChild,
} from '@liferay/site-cms-site-initializer';
import React from 'react';

import GroupingContainerSettings from './GroupingContainerSettings';

export default function renderSettings({
	child,
	disabled,
}: {
	child: StructureChild;
	disabled: boolean;
}) {
	return (
		<GroupingContainerSettings
			child={child as GroupingContainer}
			disabled={disabled}
			key={child.uuid}
		/>
	);
}
