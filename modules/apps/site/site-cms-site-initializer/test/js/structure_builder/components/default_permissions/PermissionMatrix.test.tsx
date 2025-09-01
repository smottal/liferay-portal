/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom/extend-expect';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import PermissionMatrix from '../../../../../src/main/resources/META-INF/resources/js/structure_builder/components/default_permissions/PermissionMatrix';
import {
	IActionsType,
	IRoleType,
} from '../../../../../src/main/resources/META-INF/resources/js/structure_builder/components/default_permissions/PermissionMatrixContainer';

const renderComponent = async (props: {
	actions: string[];
	roles: IRoleType[];
	values?: IActionsType;
}) => {
	return render(<PermissionMatrix {...props} />);
};

describe('Permission Matrix', () => {
	it('Generates the empty correct permission matrix', async () => {
		const props = {
			actions: ['UPDATE', 'VIEW'],
			roles: [
				{key: 'admin', name: 'Administrator'},
				{key: 'guest', name: 'Guest'},
			],
		};

		renderComponent(props);

		props.actions.forEach((action) => {
			expect(
				screen.getByTestId(`head-cell-${action}`)
			).toBeInTheDocument();
		});

		props.roles.forEach((role) => {
			expect(
				screen.getByTestId(`row-cell-${role.key}`)
			).toBeInTheDocument();

			props.actions.forEach((action) => {
				expect(
					screen.getByTestId(`row-cell-${role.key}_${action}`)
				).toBeInTheDocument();

				expect(
					screen.getByTestId(`row-checkbox-${role.key}_${action}`)
				).toBeInTheDocument();
				expect(
					screen.getByTestId(`row-checkbox-${role.key}_${action}`)
				).not.toBeChecked();
			});
		});

		expect(
			screen.getByRole(`textbox`, {name: /search/i})
		).toBeInTheDocument();
		expect(
			screen.getByRole(`navigation`, {name: /pagination/i})
		).toBeInTheDocument();
	});

	it('Preload checked permissions', async () => {
		const props = {
			actions: ['UPDATE', 'VIEW'],
			roles: [
				{key: 'admin', name: 'Administrator'},
				{key: 'guest', name: 'Guest'},
				{key: 'owner', name: 'Owner'},
			],
			values: {admin: ['UPDATE', 'VIEW'], owner: ['VIEW']},
		};

		renderComponent(props);

		expect(screen.getByTestId(`row-checkbox-admin_UPDATE`)).toBeChecked();
		expect(screen.getByTestId(`row-checkbox-admin_VIEW`)).toBeChecked();
		expect(
			screen.getByTestId(`row-checkbox-guest_UPDATE`)
		).not.toBeChecked();
		expect(screen.getByTestId(`row-checkbox-guest_VIEW`)).not.toBeChecked();
		expect(
			screen.getByTestId(`row-checkbox-owner_UPDATE`)
		).not.toBeChecked();
		expect(screen.getByTestId(`row-checkbox-owner_VIEW`)).toBeChecked();
	});

	it('Search', async () => {
		const props = {
			actions: ['UPDATE', 'VIEW'],
			roles: [
				{key: 'admin', name: 'Administrator'},
				{key: 'guest', name: 'Guest'},
				{key: 'owner', name: 'Owner'},
			],
		};

		renderComponent(props);

		const searchInput = screen.getByLabelText(/search/i);

		await userEvent.clear(searchInput);
		await userEvent.type(searchInput, 'o');

		fireEvent.blur(searchInput);

		await waitFor(() => {
			expect(screen.queryByTestId(`row-cell-admin`)).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-cell-guest`)
			).not.toBeInTheDocument();
			expect(screen.queryByTestId(`row-cell-owner`)).toBeInTheDocument();
		});

		await userEvent.clear(searchInput);
		await userEvent.type(searchInput, 'ow');

		fireEvent.blur(searchInput);

		await waitFor(() => {
			expect(
				screen.queryByTestId(`row-cell-admin`)
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-cell-guest`)
			).not.toBeInTheDocument();
			expect(screen.queryByTestId(`row-cell-owner`)).toBeInTheDocument();
		});

		await userEvent.clear(searchInput);

		fireEvent.blur(searchInput);

		await waitFor(() => {
			expect(screen.queryByTestId(`row-cell-admin`)).toBeInTheDocument();
			expect(screen.queryByTestId(`row-cell-guest`)).toBeInTheDocument();
			expect(screen.queryByTestId(`row-cell-owner`)).toBeInTheDocument();
		});
	});
});
