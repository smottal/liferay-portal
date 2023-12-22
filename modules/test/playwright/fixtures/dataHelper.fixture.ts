/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import { test as base } from '@playwright/test';
import {DataHelper} from '../helpers/DataHelper';

export const test = base.extend<TDataHelperFixture>({
	_dataHelper: async ({page}, use) => {
		await use(new DataHelper(page));
	},
});

type TDataHelperFixture = {
	_dataHelper: DataHelper,
};