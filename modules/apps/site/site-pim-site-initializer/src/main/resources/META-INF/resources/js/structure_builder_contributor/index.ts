/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	STRUCTURE_BUILDER_CONTRIBUTORS_ID,
	StructureBuilderRegistry,
	findChild,
	getUuid,
} from '@liferay/site-cms-site-initializer';

import addPanel from './addPanel';
import addTab from './addTab';
import applyObjectLayout from './applyObjectLayout';
import buildTemplateChildren from './buildTemplateChildren';
import getItemActions from './getItemActions';
import isGroupingContainer from './isGroupingContainer';
import persistObjectLayout from './persistObjectLayout';
import renderSettings from './renderSettings';
import updateGroupingContainer from './updateGroupingContainer';

const PRODUCT_TYPES_FOLDER_ERC = 'L_PIM_PRODUCT_TYPES';

export function registerStructureBuilderContributor(): void {
	Liferay.componentReady(STRUCTURE_BUILDER_CONTRIBUTORS_ID).then(
		(registry: StructureBuilderRegistry) => {
			registry.addProvider({
				deserialize: applyObjectLayout,
				getItemActions,
				id: 'pim-grouping',
				isGroupingContainer,
				persist: persistObjectLayout,
				reduce: ({action, invalids, structure}) => {
					if (action.type === 'update-grouping-container') {
						return updateGroupingContainer({
							action,
							invalids,
							structure,
						});
					}

					const items = action.uuids.map(
						(uuid) => findChild({root: structure, uuid})!
					);

					const uuid = getUuid();

					if (action.variant === 'tab') {
						return {
							children: addTab({
								root: structure,
								tabChildren: items,
								tabParent: action.parent,
								tabUuid: uuid,
							}),
							selection: [uuid],
						};
					}

					return {
						children: addPanel({
							panelChildren: items,
							panelParent: action.parent,
							panelUuid: uuid,
							root: structure,
						}),
						selection: [uuid],
					};
				},
				renderSettings,
				seedChildren: buildTemplateChildren,
				supports: (type) => type === PRODUCT_TYPES_FOLDER_ERC,
			});
		}
	);
}
