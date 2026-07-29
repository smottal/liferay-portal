/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	Structure,
	StructureBuilderReduceAction,
	Uuid,
	findChild,
} from '@liferay/site-cms-site-initializer';
import {openToast} from 'frontend-js-components-web';

export default function handleAddPanel({
	dispatch,
	structure,
	uuids,
}: {
	dispatch: (action: StructureBuilderReduceAction) => void;
	structure: Structure;
	uuids: Uuid[];
}) {
	const items = uuids.map((uuid) => findChild({root: structure, uuid})!);

	const parents = items.map((item) => item.parent);

	if (new Set(parents).size > 1) {
		openToast({
			message: Liferay.Language.get(
				'selected-items-must-be-at-the-same-hierarchy-level'
			),
			type: 'danger',
		});

		return;
	}

	const parent = items[0].parent;

	const parentItem =
		parent === structure.uuid
			? null
			: findChild({root: structure, uuid: parent});

	if (
		parentItem?.type === 'grouping-container' &&
		parentItem.variant === 'panel'
	) {
		openToast({
			message: Liferay.Language.get(
				'a-panel-cannot-be-created-inside-another-panel'
			),
			type: 'danger',
		});

		return;
	}

	dispatch({parent, type: 'add-grouping-container', uuids, variant: 'panel'});
}
