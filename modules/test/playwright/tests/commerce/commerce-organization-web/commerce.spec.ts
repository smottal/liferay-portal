/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
import {expect, mergeTests} from '@playwright/test';
// @ts-ignore
import {test as ApiHelpersTest} from '../../../fixtures/apiHelpers.fixture';
// @ts-ignore
import {test as applicationsMenuPagesTest} from '../../../fixtures/applicationsMenuPages.fixture';
import {test as dataHelperTest} from '../../../fixtures/dataHelper.fixture';
import {TOrganization} from "../../../helpers/HeadlessAdminUserApiHelper";
import {getRandomInt} from '../../../utils/util';

export const test = mergeTests(ApiHelpersTest, applicationsMenuPagesTest, dataHelperTest);

const getRandomOrganization = (organization: TOrganization = {}) => {
	const randomOrganization: TOrganization = {
		externalReferenceCode: 'Organization' + getRandomInt(),
		name: 'Organization' + getRandomInt(),
	};

	return Object.assign(randomOrganization, organization);
};

test.afterEach(async ({_dataHelper}) => {
	await _dataHelper.clearData();
});

test('generic test', async ({_apiHelpers, page}) => {
	await page.goto('/');

	let organizations = await _apiHelpers.headlessAdminUser.getOrganizations();

	const organizationCount = organizations.length;

	await _apiHelpers.headlessAdminUser.postRandomOrganization(
		getRandomOrganization()
	);

	organizations = await _apiHelpers.headlessAdminUser.getOrganizations();

	expect(organizations.length).toBe(organizationCount + 1);
});
