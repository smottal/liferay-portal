/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Locator, Page} from '@playwright/test';

export class DigitalSalesRoomUsersPage {
	readonly doneButton: Locator;
	readonly inviteButton: Locator;
	readonly page: Page;
	readonly removeUserModal: Locator;
	readonly removeUserModalRemoveButton: Locator;
	readonly userEmailAddressesInput: Locator;

	constructor(page: Page) {
		this.doneButton = page.getByRole('button', {name: 'Done'});
		this.inviteButton = page.locator('[data-testid="inviteButton"]');
		this.page = page;
		this.removeUserModal = page.locator('.modal-dialog');
		this.removeUserModalRemoveButton = this.removeUserModal.getByRole(
			'button',
			{name: 'Remove'}
		);
		this.userEmailAddressesInput = page.locator(
			'[data-testid="emailAddressesInput"]'
		);
	}

	externalText(nameOrEmail: string): Locator {
		return this.userRow(nameOrEmail).getByText('External');
	}

	internalText(nameOrEmail: string): Locator {
		return this.userRow(nameOrEmail).getByText('Internal');
	}

	removeUserButton(nameOrEmail: string): Locator {
		return this.userRow(nameOrEmail)
			.getByRole('button')
			.filter({has: this.page.locator('.lexicon-icon-trash')});
	}

	roleDropdown(nameOrEmail: string): Locator {
		return this.userRow(nameOrEmail).locator('.dropdown-toggle');
	}

	roleText(nameOrEmail: string, role: string): Locator {
		return this.userRow(nameOrEmail).getByText(role, {exact: true});
	}

	userRow(nameOrEmail: string): Locator {
		return this.page.locator('.user-row').filter({hasText: nameOrEmail});
	}
}
