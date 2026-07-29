/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	Structure,
	StructureBuilderItemAction,
	StructureBuilderReduceAction,
	StructureChild,
	isField,
} from '@liferay/site-cms-site-initializer';

import handleAddPanel from './handleAddPanel';
import handleAddTab from './handleAddTab';

export default function getItemActions({
	dispatch,
	items,
	structure,
}: {
	dispatch: (action: StructureBuilderReduceAction) => void;
	items: StructureChild[];
	structure: Structure;
}): StructureBuilderItemAction[] {
	const actions: StructureBuilderItemAction[] = [];

	const uuids = items.map((item) => item.uuid);

	if (
		items.every(
			(item) =>
				isField(item) ||
				(item.type === 'grouping-container' && item.variant === 'panel')
		)
	) {
		actions.push({
			label: Liferay.Language.get('create-tab'),
			onClick: () => handleAddTab({dispatch, structure, uuids}),
			symbolLeft: 'cards2',
		});
	}

	if (items.every((item) => isField(item))) {
		actions.push({
			label: Liferay.Language.get('create-panel'),
			onClick: () => handleAddPanel({dispatch, structure, uuids}),
			symbolLeft: 'container',
		});
	}

	return actions;
}
