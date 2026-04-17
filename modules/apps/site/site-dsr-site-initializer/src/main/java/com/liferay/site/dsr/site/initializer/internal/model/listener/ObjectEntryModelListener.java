/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.site.dsr.site.initializer.internal.model.listener;

import com.liferay.analytics.settings.configuration.AnalyticsConfiguration;
import com.liferay.analytics.settings.rest.manager.AnalyticsSettingsManager;
import com.liferay.fragment.entry.processor.constants.FragmentEntryProcessorConstants;
import com.liferay.fragment.model.FragmentEntryLink;
import com.liferay.fragment.service.FragmentEntryLinkLocalService;
import com.liferay.layout.page.template.model.LayoutPageTemplateEntry;
import com.liferay.layout.page.template.service.LayoutPageTemplateEntryLocalService;
import com.liferay.layout.util.LayoutServiceContextHelper;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.model.ObjectEntry;
import com.liferay.object.service.ObjectEntryLocalService;
import com.liferay.petra.executor.PortalExecutorManager;
import com.liferay.portal.kernel.exception.ModelListenerException;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.BaseModelListener;
import com.liferay.portal.kernel.model.Company;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.GroupConstants;
import com.liferay.portal.kernel.model.LayoutSetPrototype;
import com.liferay.portal.kernel.model.ModelListener;
import com.liferay.portal.kernel.model.Role;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.model.role.RoleConstants;
import com.liferay.portal.kernel.service.ClassNameLocalService;
import com.liferay.portal.kernel.service.CompanyLocalService;
import com.liferay.portal.kernel.service.GroupLocalService;
import com.liferay.portal.kernel.service.LayoutSetPrototypeLocalService;
import com.liferay.portal.kernel.service.RoleLocalService;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextThreadLocal;
import com.liferay.portal.kernel.service.UserGroupRoleLocalService;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.transaction.TransactionCommitCallbackUtil;
import com.liferay.portal.kernel.util.ArrayUtil;
import com.liferay.portal.kernel.util.ContentTypes;
import com.liferay.portal.kernel.util.GetterUtil;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.kernel.util.Http;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.StringUtil;
import com.liferay.portal.kernel.util.UnicodeProperties;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.liveusers.LiveUsers;
import com.liferay.portal.security.permission.PermissionCacheUtil;
import com.liferay.sites.kernel.util.Sites;

import java.io.Serializable;

import java.net.HttpURLConnection;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Stefano Motta
 */
@Component(service = ModelListener.class)
public class ObjectEntryModelListener extends BaseModelListener<ObjectEntry> {

	@Override
	public void onAfterCreate(ObjectEntry objectEntry)
		throws ModelListenerException {

		try {
			_onAfterCreate(objectEntry);
		}
		catch (Exception exception) {
			throw new ModelListenerException(exception);
		}
	}

	@Override
	public void onAfterRemove(ObjectEntry objectEntry)
		throws ModelListenerException {

		try {
			_onAfterRemove(objectEntry);
		}
		catch (Exception exception) {
			throw new ModelListenerException(exception);
		}
	}

	private void _connectSiteToAnalyticsChannel(long companyId, long groupId)
		throws Exception {

		AnalyticsConfiguration analyticsConfiguration =
			_analyticsSettingsManager.getAnalyticsConfiguration(companyId);

		if (Validator.isNull(
				analyticsConfiguration.liferayAnalyticsDataSourceId()) ||
			Validator.isNull(
				analyticsConfiguration.
					liferayAnalyticsFaroBackendSecuritySignature()) ||
			Validator.isNull(
				analyticsConfiguration.liferayAnalyticsFaroBackendURL())) {

			return;
		}

		String analyticsChannelId = _getAnalyticsChannelId(
			analyticsConfiguration);

		if (Validator.isNull(analyticsChannelId)) {
			if (_log.isDebugEnabled()) {
				_log.debug(
					"No analytics channel found for company " + companyId);
			}

			return;
		}

		Long[] existingSiteIds = _analyticsSettingsManager.getSiteIds(
			analyticsChannelId, companyId);

		if (ArrayUtil.contains(existingSiteIds, groupId)) {
			return;
		}

		Long[] newSiteIds = ArrayUtil.append(existingSiteIds, groupId);

		_updateAnalyticsCloudChannel(
			analyticsChannelId, analyticsConfiguration, newSiteIds);

		String[] updatedSiteIds = _analyticsSettingsManager.updateSiteIds(
			analyticsChannelId, companyId, newSiteIds);

		_analyticsSettingsManager.updateCompanyConfiguration(
			companyId,
			HashMapBuilder.<String, Object>put(
				"syncedGroupIds", updatedSiteIds
			).build());
	}

	private String _getAnalyticsChannelId(
		AnalyticsConfiguration analyticsConfiguration) {

		for (String syncedGroupId :
				analyticsConfiguration.syncedGroupIds()) {

			Group group = _groupLocalService.fetchGroup(
				GetterUtil.getLong(syncedGroupId));

			if (group == null) {
				continue;
			}

			String analyticsChannelId =
				group.getTypeSettingsProperty("analyticsChannelId");

			if (Validator.isNotNull(analyticsChannelId)) {
				return analyticsChannelId;
			}
		}

		return null;
	}

	private String _getFriendlyURL(String friendlyURL) {
		if (Validator.isNotNull(friendlyURL) && !friendlyURL.startsWith("/")) {
			return "/" + friendlyURL;
		}

		return friendlyURL;
	}

	private ServiceContext _getServiceContext(long companyId, long userId)
		throws PortalException {

		ServiceContext serviceContext = new ServiceContext();

		serviceContext.setCompanyId(companyId);
		serviceContext.setUserId(userId);

		ServiceContextThreadLocal.pushServiceContext(serviceContext);

		return serviceContext;
	}

	private void _onAfterCreate(ObjectEntry objectEntry) throws Exception {
		ObjectDefinition objectDefinition = objectEntry.getObjectDefinition();

		if (!Objects.equals(
				objectDefinition.getExternalReferenceCode(), "L_DSR_ROOM")) {

			return;
		}

		Company company = _companyLocalService.getCompany(
			objectEntry.getCompanyId());
		Group group;
		LayoutSetPrototype layoutSetPrototype = null;
		User user = _userLocalService.getUser(objectEntry.getUserId());

		try (AutoCloseable autoCloseable =
				_layoutServiceContextHelper.getServiceContextAutoCloseable(
					company, user)) {

			Map<String, Serializable> values = objectEntry.getValues();

			group = _groupLocalService.addGroup(
				null, user.getUserId(), GroupConstants.DEFAULT_PARENT_GROUP_ID,
				objectDefinition.getClassName(), objectEntry.getObjectEntryId(),
				GroupConstants.DEFAULT_LIVE_GROUP_ID,
				HashMapBuilder.put(
					LocaleUtil.getDefault(),
					GetterUtil.getString(values.get("name"))
				).build(),
				null, GroupConstants.TYPE_SITE_RESTRICTED, null, true,
				GroupConstants.DEFAULT_MEMBERSHIP_RESTRICTION,
				_getFriendlyURL(
					GetterUtil.getString(
						values.get("friendlyURL"),
						GetterUtil.getString(values.get("name")))),
				true, false, true,
				_getServiceContext(company.getCompanyId(), user.getUserId()));

			Role role = _roleLocalService.getRole(
				group.getCompanyId(), RoleConstants.SITE_OWNER);

			_userGroupRoleLocalService.addUserGroupRoles(
				user.getUserId(), group.getGroupId(),
				new long[] {role.getRoleId()});

			_userLocalService.addGroupUsers(
				group.getGroupId(), new long[] {user.getUserId()});

			LiveUsers.joinGroup(
				group.getCompanyId(), group.getGroupId(), user.getUserId());

			layoutSetPrototype =
				_layoutSetPrototypeLocalService.
					getLayoutSetPrototypeByUuidAndCompanyId(
						GetterUtil.getString(
							values.get("siteTemplateKey"),
							"L_DSR_LAYOUT_SET_PROTOTYPE"),
						company.getCompanyId());
		}

		Role administratorRole = _roleLocalService.getRole(
			company.getCompanyId(), RoleConstants.ADMINISTRATOR);

		try (AutoCloseable autoCloseable =
				_layoutServiceContextHelper.getServiceContextAutoCloseable(
					company,
					_userLocalService.getUser(
						_userLocalService.getRoleUserIds(
							administratorRole.getRoleId())[0]))) {

			_sites.updateLayoutSetPrototypesLinks(
				group, layoutSetPrototype.getLayoutSetPrototypeId(), 0, false,
				false);

			_updateFragmentEntryLink(group);

			TransactionCommitCallbackUtil.registerCallback(
				() -> {
					_objectEntryLocalService.partialUpdateObjectEntry(
						objectEntry.getUserId(), objectEntry.getObjectEntryId(),
						objectEntry.getObjectEntryFolderId(),
						HashMapBuilder.<String, Serializable>put(
							"friendlyURL",
							StringUtil.removeFirst(group.getFriendlyURL(), "/")
						).put(
							"siteExternalReferenceCode",
							group.getExternalReferenceCode()
						).put(
							"siteId", group.getGroupId()
						).build(),
						new ServiceContext());

					_portalExecutorManager.getPortalExecutor(
						ObjectEntryModelListener.class.getName()
					).submit(() -> {
						try {
							_connectSiteToAnalyticsChannel(
								company.getCompanyId(), group.getGroupId());
						}
						catch (Exception exception) {
							_log.error(
								"Unable to connect site " +
									group.getGroupId() +
										" to analytics channel",
								exception);
						}
					});

					return null;
				});
		}
		catch (Exception exception) {

			// LPS-169057

			PermissionCacheUtil.clearCache(objectEntry.getUserId());

			throw exception;
		}
		finally {
			ServiceContextThreadLocal.popServiceContext();
		}
	}

	private void _onAfterRemove(ObjectEntry objectEntry)
		throws PortalException {

		ObjectDefinition objectDefinition = objectEntry.getObjectDefinition();

		if (!Objects.equals(
				objectDefinition.getExternalReferenceCode(), "L_DSR_ROOM")) {

			return;
		}

		Group group = _groupLocalService.fetchGroup(
			objectEntry.getCompanyId(),
			_classNameLocalService.getClassNameId(
				objectDefinition.getClassName()),
			objectEntry.getObjectEntryId());

		if (group != null) {
			_groupLocalService.deleteGroup(group);
		}
	}

	private void _updateAnalyticsCloudChannel(
			String analyticsChannelId,
			AnalyticsConfiguration analyticsConfiguration, Long[] siteIds)
		throws Exception {

		Locale locale = LocaleUtil.getDefault();

		Http.Options options = new Http.Options();

		options.addHeader("Content-Type", ContentTypes.APPLICATION_JSON);
		options.addHeader(
			"OSB-Asah-Faro-Backend-Security-Signature",
			analyticsConfiguration.
				liferayAnalyticsFaroBackendSecuritySignature());
		options.addHeader(
			"OSB-Asah-Project-ID",
			analyticsConfiguration.liferayAnalyticsProjectId());
		options.setBody(
			JSONUtil.put(
				"dataSourceId",
				analyticsConfiguration.liferayAnalyticsDataSourceId()
			).put(
				"groups",
				JSONUtil.toJSONArray(
					siteIds,
					siteId -> {
						Group group = _groupLocalService.fetchGroup(siteId);

						if (group == null) {
							return null;
						}

						return JSONUtil.put(
							"id", String.valueOf(group.getGroupId())
						).put(
							"name", group.getDescriptiveName(locale)
						);
					})
			).toString(),
			ContentTypes.APPLICATION_JSON, "UTF-8");
		options.setLocation(
			String.format(
				"%s/api/1.0/channels/%s",
				analyticsConfiguration.liferayAnalyticsFaroBackendURL(),
				analyticsChannelId));
		options.setPatch(true);

		_http.URLtoString(options);

		Http.Response response = options.getResponse();

		if (response.getResponseCode() != HttpURLConnection.HTTP_OK) {
			throw new PortalException(
				"Unable to update analytics channel " + analyticsChannelId +
					", response code: " + response.getResponseCode());
		}
	}

	private void _updateFragmentEntryLink(Group group) {
		LayoutPageTemplateEntry layoutPageTemplateEntry =
			_layoutPageTemplateEntryLocalService.fetchLayoutPageTemplateEntry(
				group.getGroupId(), "digital-sales-room-master");

		if (layoutPageTemplateEntry == null) {
			return;
		}

		List<FragmentEntryLink> fragmentEntryLinks =
			_fragmentEntryLinkLocalService.getFragmentEntryLinksByPlid(
				group.getGroupId(), layoutPageTemplateEntry.getPlid());

		for (FragmentEntryLink fragmentEntryLink : fragmentEntryLinks) {
			if (!Objects.equals(
					fragmentEntryLink.getRendererKey(), _RENDERER_KEY)) {

				continue;
			}

			JSONObject jsonObject =
				fragmentEntryLink.getEditableValuesJSONObject();

			jsonObject = jsonObject.getJSONObject(
				FragmentEntryProcessorConstants.
					KEY_FREEMARKER_FRAGMENT_ENTRY_PROCESSOR);

			if (jsonObject == null) {
				continue;
			}

			jsonObject.put("source", "");

			try {
				_fragmentEntryLinkLocalService.updateFragmentEntryLink(
					fragmentEntryLink.getUserId(),
					fragmentEntryLink.getFragmentEntryLinkId(),
					jsonObject.toString(), false);
			}
			catch (PortalException portalException) {
				_log.error(portalException);
			}
		}
	}

	private static final String _RENDERER_KEY =
		"com.liferay.fragment.renderer.menu.display.internal." +
			"MenuDisplayFragmentRenderer";

	private static final Log _log = LogFactoryUtil.getLog(
		ObjectEntryModelListener.class);

	@Reference
	private AnalyticsSettingsManager _analyticsSettingsManager;

	@Reference
	private ClassNameLocalService _classNameLocalService;

	@Reference
	private CompanyLocalService _companyLocalService;

	@Reference
	private FragmentEntryLinkLocalService _fragmentEntryLinkLocalService;

	@Reference
	private GroupLocalService _groupLocalService;

	@Reference
	private Http _http;

	@Reference
	private LayoutPageTemplateEntryLocalService
		_layoutPageTemplateEntryLocalService;

	@Reference
	private LayoutServiceContextHelper _layoutServiceContextHelper;

	@Reference
	private LayoutSetPrototypeLocalService _layoutSetPrototypeLocalService;

	@Reference
	private ObjectEntryLocalService _objectEntryLocalService;

	@Reference
	private PortalExecutorManager _portalExecutorManager;

	@Reference
	private RoleLocalService _roleLocalService;

	@Reference
	private Sites _sites;

	@Reference
	private UserGroupRoleLocalService _userGroupRoleLocalService;

	@Reference
	private UserLocalService _userLocalService;

}
