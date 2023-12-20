/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

const {expect, mergeTests} = require('@playwright/test');

import {test as ApiHelpersTest} from '../../fixtures/apiHelpers.fixture';
import {test as applicationsMenuPagesTest} from '../../fixtures/applicationsMenuPages.fixture';
import {test as commercePagesTest} from '../../fixtures/commercePages.fixture';
import {test as dataHelperTest} from '../../fixtures/dataHelper.fixture';
import {getRandomInt} from '../../utils/util';

export const test = mergeTests(ApiHelpersTest, applicationsMenuPagesTest, commercePagesTest, dataHelperTest);

const getRandomPayment = (payment = {}) => {
	const randomPayment = {
		amount: getRandomInt(),
		channelId: getRandomInt(),
		currencyCode: 'USD',
		externalReferenceCode: 'Payment' + getRandomInt(),
		paymentIntegrationKey: 'paypal-integration',
		paymentIntegrationType: 0,
		relatedItemId: getRandomInt(),
		relatedItemName: 'com.liferay.commerce.model.CommerceOrder',
		type: 0,
	};

	return Object.assign(randomPayment, payment);
};

test.afterEach(async ({_dataHelper}) => {
	await _dataHelper.clearData();
});

test('payments page is visible', async ({_apiHelpers, _applicationsMenuPage, page, _paymentsPage}) => {
	await _apiHelpers.featureFlag.updateFeatureFlag('COMMERCE-12754', 'false');

	await _applicationsMenuPage.goToCommerce();

	await expect(_applicationsMenuPage.paymentsMenuItem).toHaveCount(0);

	await _apiHelpers.featureFlag.updateFeatureFlag('COMMERCE-12754', 'true');

	const payment = await _apiHelpers.headlessCommerceAdminPayment.postRandomPayment(
		getRandomPayment()
	);

	await _paymentsPage.goto();

	await expect(_paymentsPage.titleHeading).toBeVisible();

	await expect(_paymentsPage.makeRefundButton).toHaveCount(0);

	await _applicationsMenuPage.goToInstanceSettingsPaymentRefundReasons();

	await page.getByRole('link', {exact: true, name: 'Add',}).click();

	await page.waitForNavigation();

	await page.getByText('Key').fill('test-reason');
	await page.getByText('Nameen-usName').locator('textarea').fill('Test Reason');
	await page.getByText('Priority').fill('1');

	await page.getByRole('button', {exact: true, name: 'Save',}).click();

	await _apiHelpers.headlessCommerceAdminPayment.patchPayment(payment.id, {paymentStatus: 0});

	await _paymentsPage.goto();

	await expect(_paymentsPage.makeRefundButton).toBeVisible();

	await _paymentsPage.makeRefundButton.click();
});
