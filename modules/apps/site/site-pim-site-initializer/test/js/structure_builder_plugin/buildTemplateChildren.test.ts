/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	GroupingContainer,
	ObjectDefinition,
	ObjectField,
	ObjectLayout,
	getUuid,
} from '@liferay/site-cms-site-initializer';

import buildTemplateChildren from '../../../src/main/resources/META-INF/resources/js/structure_builder_contributor/buildTemplateChildren';

const PARENT = getUuid();

function createObjectField(overrides: Partial<ObjectField> = {}): ObjectField {
	return {
		DBType: 'String',
		businessType: 'Text',
		externalReferenceCode: 'TEST',
		indexed: false,
		label: {en_US: 'Test'},
		localized: false,
		name: 'test',
		required: false,
		system: false,
		...overrides,
	} as ObjectField;
}

function createObjectDefinition(
	overrides: Partial<ObjectDefinition> = {}
): ObjectDefinition {
	return {
		externalReferenceCode: 'TEMPLATE_ERC',
		label: {en_US: 'Template'},
		objectFields: [
			createObjectField({externalReferenceCode: 'CODE', name: 'code'}),
			createObjectField({
				externalReferenceCode: 'DESCRIPTION',
				name: 'description',
			}),
		],
		pluralLabel: {en_US: 'Templates'},
		scope: 'depot',
		status: {code: 0},
		...overrides,
	} as ObjectDefinition;
}

const GROUPED_OBJECT_LAYOUT: ObjectLayout = {
	defaultObjectLayout: true,
	name: {en_US: 'Template'},
	objectDefinitionExternalReferenceCode: 'TEMPLATE_ERC',
	objectLayoutTabs: [
		{
			name: {en_US: 'Details'},
			objectLayoutBoxes: [
				{
					collapsable: true,
					name: {en_US: 'Specs'},
					objectLayoutRows: [
						{
							objectLayoutColumns: [
								{
									objectFieldName: 'code',
									priority: 0,
									size: 12,
								},
							],
							priority: 0,
						},
					],
					priority: 0,
					type: 'regular',
				},
			],
			priority: 0,
		},
	],
};

describe('buildTemplateChildren - grouping template copy', () => {
	it('copies the template fields flat when there is no object layout', () => {
		const children = buildTemplateChildren({
			objectDefinition: createObjectDefinition(),
			objectDefinitions: {},
			parent: PARENT,
		});

		const items = Array.from(children.values());

		expect(items.every((item) => item.parent === PARENT)).toBe(true);

		const names = items.map((item) => ('name' in item ? item.name : ''));

		expect(names).toContain('code');
		expect(names).toContain('description');
		expect(
			items.some(
				(item) =>
					item.type === 'grouping-container' && item.variant === 'tab'
			)
		).toBe(false);
		expect(
			items.some(
				(item) =>
					item.type === 'grouping-container' &&
					item.variant === 'panel'
			)
		).toBe(false);
	});

	it('copies the object layout grouping and reparents it to the new structure', () => {
		const children = buildTemplateChildren({
			objectDefinition: createObjectDefinition({
				objectLayouts: [GROUPED_OBJECT_LAYOUT],
			}),
			objectDefinitions: {},
			parent: PARENT,
		});

		const items = Array.from(children.values());

		const tab = items.find(
			(item) =>
				item.type === 'grouping-container' && item.variant === 'tab'
		) as GroupingContainer | undefined;

		expect(tab).toBeDefined();
		expect(tab!.label).toEqual({en_US: 'Details'});
		expect(tab!.parent).toBe(PARENT);

		const panel = Array.from(tab!.children.values()).find(
			(item) =>
				item.type === 'grouping-container' && item.variant === 'panel'
		) as GroupingContainer | undefined;

		expect(panel).toBeDefined();
		expect(panel!.label).toEqual({en_US: 'Specs'});
		expect(panel!.parent).toBe(tab!.uuid);

		const panelFieldNames = Array.from(panel!.children.values()).map(
			(item) => ('name' in item ? item.name : '')
		);

		expect(panelFieldNames).toEqual(['code']);

		const looseNames = items
			.filter((item) => 'name' in item)
			.map((item) => ('name' in item ? item.name : ''));

		expect(looseNames).toContain('description');
	});
});
