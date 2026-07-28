/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {
	Field,
	GroupingContainer,
	Structure,
	Uuid,
	getUuid,
} from '@liferay/site-cms-site-initializer';
import {act, render} from '@testing-library/react';
import React, {Dispatch, useEffect} from 'react';

import {
	Action,
	State,
	StateContextProvider,
	useSelector,
	useStateDispatch,
} from '../../../../site-cms-site-initializer/src/main/resources/META-INF/resources/js/structure_builder/contexts/StateContext';
import structureBuilderRegistry from '../../../../site-cms-site-initializer/src/main/resources/META-INF/resources/js/structure_builder/contributors/registry';

const STRUCTURE_UUID = getUuid();
const TITLE_UUID = getUuid();
const SKU_UUID = getUuid();

function field(name: string, uuid: Uuid): Field {
	return {
		erc: `${name}-erc`,
		indexableConfig: {indexed: false},
		label: {en_US: name},
		localized: false,
		locked: false,
		name,
		parent: STRUCTURE_UUID,
		required: false,
		settings: {},
		type: 'text',
		uuid,
	};
}

function buildInitialState(publishedChildren: Set<Uuid> = new Set()): State {
	const structure: Structure = {
		children: new Map([
			[TITLE_UUID, field('title', TITLE_UUID)],
			[SKU_UUID, field('sku', SKU_UUID)],
		]),
		erc: 'structure-erc',
		label: {en_US: 'Structure'},
		name: 'Structure',
		path: '',
		spaces: 'all',
		status: 'draft',
		system: false,
		type: 'L_CUSTOM_STRUCTURES',
		uuid: STRUCTURE_UUID,
		workflows: {},
	};

	return {
		clipboard: null,
		history: {
			deletedChildren: [],
			deletedGroupERCs: [],
			deletedRelationships: [],
			modifiedNames: new Set(),
		},
		invalids: new Map(),
		publishedChildren,
		renamingItemUuid: null,
		selection: [],
		structure,
		unsavedChanges: false,
	};
}

type Refs = {
	dispatch?: Dispatch<Action>;
	state?: State;
};

function renderWithState(initialState: State) {
	const refs: Refs = {};

	function Harness() {
		const state = useSelector((s) => s);
		const dispatch = useStateDispatch();

		useEffect(() => {
			refs.dispatch = dispatch;
			refs.state = state;
		});

		return null;
	}

	render(
		<StateContextProvider initialState={initialState}>
			<Harness />
		</StateContextProvider>
	);

	return refs;
}

describe('StateContext reducer - grouping', () => {
	beforeAll(() => {
		structureBuilderRegistry.addProvider({
			id: 'stub',
			reduce: ({action, structure}) => {
				if (action.type === 'update-grouping-container') {
					const children = new Map(structure.children);

					const container = children.get(action.uuid);

					if (container) {
						children.set(action.uuid, {
							...container,
							label: action.label,
						});
					}

					return {children};
				}

				const nodeUuid = getUuid();

				const moved = new Set(action.uuids);

				const children: Structure['children'] = new Map();

				for (const [uuid, child] of structure.children) {
					if (!moved.has(uuid)) {
						children.set(uuid, child);
					}
				}

				const nodeChildren: Structure['children'] = new Map();

				for (const uuid of action.uuids) {
					const child = structure.children.get(uuid);

					if (child) {
						nodeChildren.set(uuid, {...child, parent: nodeUuid});
					}
				}

				children.set(nodeUuid, {
					children: nodeChildren,
					label: {en_US: action.variant === 'tab' ? 'Tab' : 'Panel'},
					parent: action.parent,
					type: 'grouping-container',
					uuid: nodeUuid,
					variant: action.variant,
				} as GroupingContainer);

				return {children, selection: [nodeUuid]};
			},
			supports: () => true,
		});
	});

	beforeEach(() => {
		jest.spyOn(
			Liferay.ThemeDisplay,
			'getDefaultLanguageId'
		).mockReturnValue('en_US');
		jest.spyOn(Liferay.ThemeDisplay, 'getLanguageId').mockReturnValue(
			'en_US'
		);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('add-tab wraps the selection into a tab and selects it', () => {
		const refs = renderWithState(buildInitialState());

		act(() => {
			refs.dispatch!({
				parent: STRUCTURE_UUID,
				type: 'add-grouping-container',
				uuids: [SKU_UUID],
				variant: 'tab',
			});
		});

		const tabUuid = refs.state!.selection[0];
		const tab = refs.state!.structure.children.get(
			tabUuid
		) as GroupingContainer;

		expect(tab.variant).toBe('tab');
		expect(refs.state!.structure.children.has(TITLE_UUID)).toBe(true);
		expect(refs.state!.structure.children.has(SKU_UUID)).toBe(false);
		expect(tab.children.has(SKU_UUID)).toBe(true);
	});

	it('add-panel wraps the selection into a panel and selects it', () => {
		const refs = renderWithState(buildInitialState());

		act(() => {
			refs.dispatch!({
				parent: STRUCTURE_UUID,
				type: 'add-grouping-container',
				uuids: [SKU_UUID],
				variant: 'panel',
			});
		});

		const panelUuid = refs.state!.selection[0];
		const panel = refs.state!.structure.children.get(
			panelUuid
		) as GroupingContainer;

		expect(panel.variant).toBe('panel');
		expect(panel.children.has(SKU_UUID)).toBe(true);
	});

	it('update-tab renames the tab', () => {
		const refs = renderWithState(buildInitialState());

		act(() => {
			refs.dispatch!({
				parent: STRUCTURE_UUID,
				type: 'add-grouping-container',
				uuids: [SKU_UUID],
				variant: 'tab',
			});
		});

		const tabUuid = refs.state!.selection[0];

		act(() => {
			refs.dispatch!({
				label: {en_US: 'Specifications'},
				type: 'update-grouping-container',
				uuid: tabUuid,
			});
		});

		const tab = refs.state!.structure.children.get(
			tabUuid
		) as GroupingContainer;

		expect(tab.label).toEqual({en_US: 'Specifications'});
	});

	it('update-panel renames the panel', () => {
		const refs = renderWithState(buildInitialState());

		act(() => {
			refs.dispatch!({
				parent: STRUCTURE_UUID,
				type: 'add-grouping-container',
				uuids: [SKU_UUID],
				variant: 'panel',
			});
		});

		const panelUuid = refs.state!.selection[0];

		act(() => {
			refs.dispatch!({
				label: {en_US: 'Dimensions'},
				type: 'update-grouping-container',
				uuid: panelUuid,
			});
		});

		const panel = refs.state!.structure.children.get(
			panelUuid
		) as GroupingContainer;

		expect(panel.label).toEqual({en_US: 'Dimensions'});
	});
});
