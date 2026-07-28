/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	Field,
	GroupingContainer,
	RepeatableGroup,
	Structure,
	StructureChild,
	Uuid,
	getUuid,
} from '@liferay/site-cms-site-initializer';

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

function toMap(children: StructureChild[]): Map<Uuid, StructureChild> {
	return new Map(children.map((child) => [child.uuid, child]));
}

describe('buildObjectLayout', () => {
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

	it('returns null when the structure has no grouping', () => {
		expect(
			buildObjectLayout(structure([field('title'), field('sku')]))
		).toBeNull();
	});

	it('gathers loose fields into an implicit first General tab', () => {
		expect(
			buildObjectLayout(
				structure([field('title'), tab('Details', [field('sku')])])
			)
		).toMatchSnapshot();
	});

	it('serializes a panel as a collapsable box inside its tab', () => {
		expect(
			buildObjectLayout(
				structure([
					field('title'),
					tab('Specs', [
						panel('Dimensions', [field('width'), field('height')]),
						field('weight'),
					]),
				])
			)
		).toMatchSnapshot();
	});

	it('serializes a repeatable group as a rep-group marker box', () => {
		expect(
			buildObjectLayout(
				structure([
					field('title'),
					tab('Variants', [repeatableGroup('skuVariants')]),
				])
			)
		).toMatchSnapshot();
	});

	it('serializes a panel at the root into the General tab', () => {
		expect(
			buildObjectLayout(
				structure([field('title'), panel('Pricing', [field('price')])])
			)
		).toMatchSnapshot();
	});
});
