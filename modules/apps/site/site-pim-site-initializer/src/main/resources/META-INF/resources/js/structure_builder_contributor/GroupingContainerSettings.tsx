/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayLabel from '@clayui/label';
import ClayLayout from '@clayui/layout';
import ClayTabs from '@clayui/tabs';
import {
	GroupingContainer,
	LocalizedInput,
	StructureBreadcrumb,
	focusInvalidElement,
	selectErrors,
	useSelector,
	useStateDispatch,
} from '@liferay/site-cms-site-initializer';
import {useId} from 'frontend-js-components-web';
import React, {useEffect} from 'react';

export default function GroupingContainerSettings({
	child,
	disabled,
}: {
	child: GroupingContainer;
	disabled?: boolean;
}) {
	useEffect(() => {
		focusInvalidElement();
	}, []);

	return (
		<ClayLayout.ContainerFluid className="px-4" size="md" view>
			<StructureBreadcrumb uuid={child.uuid} />

			<ClayTabs>
				<ClayTabs.List>
					<ClayTabs.Item>
						{Liferay.Language.get('general')}
					</ClayTabs.Item>
				</ClayTabs.List>

				<ClayTabs.Panels fade>
					<ClayTabs.TabPane className="px-0">
						<GeneralTab child={child} disabled={disabled} />
					</ClayTabs.TabPane>
				</ClayTabs.Panels>
			</ClayTabs>
		</ClayLayout.ContainerFluid>
	);
}

function GeneralTab({
	child,
	disabled,
}: {
	child: GroupingContainer;
	disabled?: boolean;
}) {
	const dispatch = useStateDispatch();

	const errors = useSelector(selectErrors(child.uuid));

	const labelInputId = useId();

	return (
		<div>
			<div className="pb-2">
				<p className="font-weight-semi-bold mb-0 text-3">
					{Liferay.Language.get('field-type')}
				</p>

				<ClayLabel displayType="info" inverse>
					{child.variant === 'tab'
						? Liferay.Language.get('tab')
						: Liferay.Language.get('panel')}
				</ClayLabel>
			</div>

			<LocalizedInput
				disabled={disabled}
				error={errors.get('label')}
				formGroupClassName="mt-4"
				id={labelInputId}
				label={Liferay.Language.get('label')}
				onSave={(translations) =>
					dispatch({
						label: translations,
						type: 'update-grouping-container',
						uuid: child.uuid,
					})
				}
				required
				translations={child.label}
			/>
		</div>
	);
}
