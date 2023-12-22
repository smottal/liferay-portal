/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import { test as base } from '@playwright/test';
import {PaymentsPage} from '../pages/commerce/payments.page';

export const test = base.extend<TCommercePagesFixture>({
	_paymentsPage: async ({page}, use) => {
		await use(new PaymentsPage(page));
	},
});

type TCommercePagesFixture = {
	_paymentsPage: PaymentsPage,
};
