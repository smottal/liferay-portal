/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	Field,
	GroupingContainer,
	ObjectDefinition,
	ObjectLayout,
	RepeatableGroup,
	Structure,
	StructureChild,
	Uuid,
	getUuid,
} from '@liferay/site-cms-site-initializer';

import applyObjectLayout from '../../../src/main/resources/META-INF/resources/js/structure_builder_contributor/applyObjectLayout';
import buildObjectLayout from '../../../src/main/resources/META-INF/resources/js/structure_builder_contributor/buildObjectLayout';

const ROOT_UUID = getUuid();

function field(name: string): Field {
	return {
		erc: `${name}-erc`,
		indexableConfig: {indexed: false},
		label: {en_US: name},
		localized: false,
		locked: false,
		name,
		parent: ROOT_UUID,
		required: false,
		settings: {},
		type: 'text',
		uuid: getUuid(),
	};
}

function panel(label: string, children: StructureChild[]): GroupingContainer {
	return {
		children: toMap(children),
		label: {en_US: label},
		parent: ROOT_UUID,
		type: 'grouping-container',
		uuid: getUuid(),
		variant: 'panel',
	};
}

function repeatableGroup(relationshipName: string): RepeatableGroup {
	return {
		children: new Map(),
		erc: `${relationshipName}-erc`,
		label: {en_US: relationshipName},
		name: relationshipName,
		parent: ROOT_UUID,
		relationshipERC: `${relationshipName}-rel-erc`,
		relationshipName,
		type: 'repeatable-group',
		uuid: getUuid(),
	};
}

function structure(children: StructureChild[]): Structure {
	return {
		children: toMap(children),
		erc: 'product-erc',
		label: {en_US: 'Product'},
		name: 'Product',
		path: '',
		spaces: 'all',
		status: 'draft',
		system: false,
		type: 'L_PIM_PRODUCTS',
		uuid: ROOT_UUID,
		workflows: {},
	};
}

function tab(label: string, children: StructureChild[]): GroupingContainer {
	return {
		children: toMap(children),
		label: {en_US: label},
		parent: ROOT_UUID,
		type: 'grouping-container',
		uuid: getUuid(),
		variant: 'tab',
	};
}

function toArray(children: Map<Uuid, StructureChild>): StructureChild[] {
	return Array.from(children.values());
}

function toMap(children: StructureChild[]): Map<Uuid, StructureChild> {
	return new Map(children.map((child) => [child.uuid, child]));
}

function toObjectDefinition(objectLayout: ObjectLayout): ObjectDefinition {
	return {
		objectLayouts: [{...objectLayout, defaultObjectLayout: true}],
	} as ObjectDefinition;
}

describe('applyObjectLayout', () => {
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

	it('unwraps the General tab into loose children and rebuilds explicit tabs', () => {
		const title = field('title');
		const sku = field('sku');

		const objectLayout = buildObjectLayout(
			structure([title, tab('Details', [sku])])
		)!;

		const children = toArray(
			applyObjectLayout({
				children: toMap([title, sku]),
				objectDefinition: toObjectDefinition(objectLayout),
				parent: ROOT_UUID,
			})
		);

		const looseField = children.find((child) => child.type === 'text');
		const detailsTab = children.find(
			(child) =>
				child.type === 'grouping-container' && child.variant === 'tab'
		) as GroupingContainer;

		expect(looseField).toMatchObject({name: 'title', parent: ROOT_UUID});
		expect(detailsTab.label).toEqual({en_US: 'Details'});

		const tabChildren = toArray(detailsTab.children);

		expect(tabChildren).toHaveLength(1);
		expect(tabChildren[0]).toMatchObject({
			name: 'sku',
			parent: detailsTab.uuid,
		});
	});

	it('rebuilds a panel nested inside a tab', () => {
		const title = field('title');
		const width = field('width');

		const objectLayout = buildObjectLayout(
			structure([title, tab('Specs', [panel('Dimensions', [width])])])
		)!;

		const children = toArray(
			applyObjectLayout({
				children: toMap([title, width]),
				objectDefinition: toObjectDefinition(objectLayout),
				parent: ROOT_UUID,
			})
		);

		const specsTab = children.find(
			(child) =>
				child.type === 'grouping-container' && child.variant === 'tab'
		) as GroupingContainer;
		const nestedPanel = toArray(specsTab.children).find(
			(child) =>
				child.type === 'grouping-container' && child.variant === 'panel'
		) as GroupingContainer;

		expect(nestedPanel.label).toEqual({en_US: 'Dimensions'});
		expect(nestedPanel.parent).toBe(specsTab.uuid);

		const panelChildren = toArray(nestedPanel.children);

		expect(panelChildren).toHaveLength(1);
		expect(panelChildren[0]).toMatchObject({
			name: 'width',
			parent: nestedPanel.uuid,
		});
	});

	it('resolves a rep-group marker box back to its repeatable group node', () => {
		const title = field('title');
		const group = repeatableGroup('skuVariants');

		const objectLayout = buildObjectLayout(
			structure([title, tab('Variants', [group])])
		)!;

		const children = toArray(
			applyObjectLayout({
				children: toMap([title, group]),
				objectDefinition: toObjectDefinition(objectLayout),
				parent: ROOT_UUID,
			})
		);

		const variantsTab = children.find(
			(child) =>
				child.type === 'grouping-container' && child.variant === 'tab'
		) as GroupingContainer;

		const rebuiltGroup = toArray(
			variantsTab.children
		)[0] as RepeatableGroup;

		expect(rebuiltGroup.type).toBe('repeatable-group');
		expect(rebuiltGroup.relationshipName).toBe('skuVariants');
		expect(rebuiltGroup.parent).toBe(variantsTab.uuid);
	});

	it('keeps children the layout does not reference as loose fields', () => {
		const title = field('title');
		const sku = field('sku');
		const orphan = field('orphan');

		const objectLayout = buildObjectLayout(
			structure([title, tab('Details', [sku])])
		)!;

		const children = toArray(
			applyObjectLayout({
				children: toMap([title, sku, orphan]),
				objectDefinition: toObjectDefinition(objectLayout),
				parent: ROOT_UUID,
			})
		);

		const orphanField = children.find(
			(child) =>
				child.type === 'text' && (child as Field).name === 'orphan'
		);

		expect(orphanField).toMatchObject({name: 'orphan', parent: ROOT_UUID});
	});

	it('round-trips a grouped structure (build then apply then build is stable)', () => {
		const title = field('title');
		const sku = field('sku');
		const width = field('width');
		const group = repeatableGroup('variants');

		const authored = structure([
			title,
			tab('Specs', [panel('Dimensions', [width]), sku]),
			tab('Variants', [group]),
		]);

		const objectLayout = buildObjectLayout(authored)!;

		const children = applyObjectLayout({
			children: toMap([title, sku, width, group]),
			objectDefinition: toObjectDefinition(objectLayout),
			parent: ROOT_UUID,
		});

		const reserialized = buildObjectLayout({...authored, children});

		expect(reserialized).toEqual(objectLayout);
	});
});
