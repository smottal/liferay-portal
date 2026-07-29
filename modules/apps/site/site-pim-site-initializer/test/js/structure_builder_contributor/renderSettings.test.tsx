/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {GroupingContainer, getUuid} from '@liferay/site-cms-site-initializer';

import GroupingContainerSettings from '../../../src/main/resources/META-INF/resources/js/structure_builder_contributor/GroupingContainerSettings';
import renderSettings from '../../../src/main/resources/META-INF/resources/js/structure_builder_contributor/renderSettings';

const ROOT_UUID = getUuid();

function panel(): GroupingContainer {
	return {
		children: new Map(),
		label: {en_US: 'Panel'},
		parent: ROOT_UUID,
		type: 'grouping-container',
		uuid: getUuid(),
		variant: 'panel',
	};
}

function tab(): GroupingContainer {
	return {
		children: new Map(),
		label: {en_US: 'Tab'},
		parent: ROOT_UUID,
		type: 'grouping-container',
		uuid: getUuid(),
		variant: 'tab',
	};
}

describe('renderSettings', () => {
	it('renders the grouping-container settings form for a panel', () => {
		const child = panel();

		const element = renderSettings({child, disabled: false})!;

		expect(element.type).toBe(GroupingContainerSettings);
		expect(element.props.child).toBe(child);
		expect(element.props.disabled).toBe(false);
	});

	it('renders the grouping-container settings form for a tab', () => {
		const child = tab();

		const element = renderSettings({child, disabled: true})!;

		expect(element.type).toBe(GroupingContainerSettings);
		expect(element.props.child).toBe(child);
		expect(element.props.disabled).toBe(true);
	});

	it('keys the form by the container uuid so selection changes remount it', () => {
		const child = panel();

		const element = renderSettings({child, disabled: false})!;

		expect(element.key).toBe(child.uuid);
	});
});
