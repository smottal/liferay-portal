/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import isGroupingContainer from '../../../src/main/resources/META-INF/resources/js/structure_builder_contributor/isGroupingContainer';

describe('isGroupingContainer', () => {
	it('is true for a grouping container', () => {
		expect(isGroupingContainer({type: 'grouping-container'})).toBe(true);
	});

	it('is false for fields, relationships, and repeatable groups', () => {
		expect(isGroupingContainer({type: 'text'})).toBe(false);
		expect(isGroupingContainer({type: 'related-content'})).toBe(false);
		expect(isGroupingContainer({type: 'referenced-structure'})).toBe(false);
		expect(isGroupingContainer({type: 'repeatable-group'})).toBe(false);
	});
});
