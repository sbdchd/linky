import Vuex from 'vuex'
import Vue from 'vue'
import axios from 'axios'

Vue.use(Vuex)

import Nanobar from 'nanobar'
import { formatUrl } from './utilities.js'

const nb = new Nanobar()

const store = new Vuex.Store({
  state: {
    user: {
      authenticated: false,
      email: '',
      token: '',
    },
    links: [],
    errors: {
      addLink: {},
      removeLink: [],
      archiveLink: [],
      unarchiveLink: [],
      logout: [],
      updateLinks: [],
    },
    keybindsDisabled: 0,
    loadingprogress: 0,
    query: '',
    notification: {
      message: '',
      level: '',
      show: false,
      config: {
        button: false,
        duration: 4000,
        position: 'bottom',
        sticky: false,
        theme: 'pure',
        html: false,
      },
    },
    background: localStorage.getItem('backgroundColor') != null ? localStorage.getItem('backgroundColor') : 'white',
  },
  mutations: {
    archiveLink (state, id) {
      for (let i = 0; i < state.links.length; i++) {
        if (state.links[i].id === id) {
          state.links[i].archived = true
          return
        }
      }
    },
    archiveLinkErrors (state, errors) {
      state.errors.archiveLink = errors
    },
    unarchiveLink (state, id) {
      for (let i = 0; i < state.links.length; i++) {
        if (state.links[i].id === id) {
          state.links[i].archived = false
          return
        }
      }
    },
    unarchiveLinkErrors (state, errors) {
      state.errors.unarchiveLink = errors
    },
    removeLink (state, id) {
      state.links = state.links.filter(x => x.id !== id)
    },
    removeLinkErrors (state, errors) {
      state.errors.removeLink = errors
    },
    updateEmail (state, email) {
      state.user.email = email
    },
    updateLinks (state, linkData) {
      state.links = linkData
    },
    updateLinksErrors (state, errors) {
      state.errors.updateLinks = errors
    },
    updateArchive (state, archiveData) {
      state.archive = archiveData
    },
    updateArchiveErrors (state, errors) {
      state.errors.updateArchive = errors
    },
    addLink (state, linkData) {
      state.links.push(linkData)
    },
    addLinkErrors (state, errors) {
      state.errors.addLink = errors
    },
    addLinkErrorsClear (state) {
      state.errors.addLink = {}
    },
    loginSuccessful (state, token) {
      state.user.authenticated = true
      state.user.token = token
      localStorage.setItem('token', token)
    },
    logout (state) {
      state.user.email = ''
      state.user.authenticated = false
      state.links = []
      localStorage.clear()
    },
    logoutErrors (state, errors) {
      state.errors.logout = errors
    },
    disableKeybinds (state) {
      state.keybindsDisabled++
    },
    enableKeybinds (state) {
      state.keybindsDisabled--
    },
    updateLinkUrl (state, data) {
      let {id, url} = data
      for (let i = 0; i < state.links.length; i++) {
        if (state.links[i].id === id) {
          state.links[i].url = url
          return
        }
      }
    },
    updateLinkUrlErrors (state, errors) {
      state.errors.updateLinkUrl = errors
    },
    enableEditing (state) {
      state.keybindsDisabled++
    },
    disableEditing (state) {
      state.keybindsDisabled--
    },
    notify (state, config) {
      const {message, level, button, duration, position, sticky, theme, html} = config
      state.notification.message = message
      state.notification.level = level
      state.notification.config.button = button
      state.notification.config.duration = duration
      state.notification.config.position = position
      state.notification.config.sticky = sticky
      state.notification.config.theme = theme
      state.notification.config.html = html
      state.notification.show = true
    },
    notificationClosed (state) {
      state.notification.show = false
    },
    setBackground (state, color) {
      state.background = color
      document.getElementsByTagName('body')[0].className = color
      localStorage.setItem('backgroundColor', color)
    },
    setLoadingProgress (state, percentage) {
      state.loadingprogress = percentage
    },
    setQuery (state, query) {
      state.query = query
    },
  },
  actions: {
    isAuthenticated (context) {
      axios.get('/api/users/me/',
        {headers: {'Authorization': 'Token ' + localStorage.getItem('token')}})
        .then(response => {
          console.info('User authenticated')
          context.commit('updateEmail', response.data.email)
          context.commit('loginSuccessful', localStorage.getItem('token'))
        })
        .catch(error => {
          console.warn('Problem authenticating user.', error)
          context.commit('logout')
        })
    },
    addLink (context, url) {
      url = formatUrl(url)
      context.commit('setLoadingProgress', 30)
      return axios.post('/api/links/', {'url': url},
        {headers: {'Authorization': 'Token ' + localStorage.getItem('token')}})
        .then(response => {
          console.info('Added ' + url)
          context.commit('notify', {'message': 'Added New Link', 'level': 'info'})
          context.commit('addLink', response.data)
          context.commit('setLoadingProgress', 100)
        })
        .catch(error => {
          console.warn(`Problem adding link ${url}.`, error)
          context.commit('notify', {'message': 'Problem Adding New Link', 'level': 'warning'})
          context.commit('addLinkErrors', error.response.data)
          context.commit('setLoadingProgress', 0)
        })
    },
    refreshLinks (context) {
      axios.get('/api/links/',
        {headers: {'Authorization': 'Token ' + localStorage.getItem('token')}})
      .then(response => {
        console.info('Refreshed links')
        context.commit('updateLinks', response.data)
      })
      .catch(error => {
        console.warn('Problem getting links.', error)
        context.commit('updateLinksErrors', error)
      })
    },
    archiveLink (context, id) {
      context.commit('setLoadingProgress', 30)
      axios.patch(`/api/links/${id}/`, {'archived': true},
        {headers: {'Authorization': 'Token ' + localStorage.getItem('token')}})
        .then(response => {
          console.info('Archived Link with id:', id)
          context.commit('notify', {'message': 'Archived Link', 'level': 'info'})
          context.commit('archiveLink', id)
          context.commit('setLoadingProgress', 100)
        })
        .catch(error => {
          console.warn('Problem archiving link with id:', id, error)
          context.commit('notify', {'message': 'Problem archiving link', 'level': 'warning'})
          context.commit('archiveLinkErrors', error)
          context.commit('setLoadingProgress', 0)
        })
    },
    unarchiveLink (context, id) {
      context.commit('setLoadingProgress', 30)
      axios.patch(`/api/links/${id}/`, {'archived': false},
        {headers: {'Authorization': 'Token ' + localStorage.getItem('token')}})
        .then(response => {
          console.info('Unarchived Link with id:', id)
          context.commit('notify', {'message': 'Unarchived Link', 'level': 'info'})
          context.commit('unarchiveLink', id)
          context.commit('setLoadingProgress', 100)
        })
        .catch(error => {
          console.warn('Problem unarchiving link with id:', id, error)
          context.commit('notify', {'message': 'Problem Unarchiving Link', 'level': 'warning'})
          context.commit('unarchiveLinkErrors', error)
          context.commit('setLoadingProgress', 0)
        })
    },
    removeLink (context, id) {
      context.commit('setLoadingProgress', 30)
      axios.delete(`/api/links/${id}/`,
        {headers: {'Authorization': 'Token ' + localStorage.getItem('token')}})
        .then(response => {
          console.info('Deleted link with id:', id)
          context.commit('notify', {'message': 'Deleted Link', 'level': 'info'})
          context.commit('removeLink', id)
          context.commit('setLoadingProgress', 100)
        })
        .catch(error => {
          context.commit('notify', {'message': 'Problem Deleting Link', 'level': 'warning'})
          console.warn("Couldn't remove Link", error)
          context.commit('removeLinkErrors', error)
          context.commit('setLoadingProgress', 0)
        })
    },
    changeLinkUrl (context, data) {
      let {id, url} = data
      context.commit('setLoadingProgress', 30)
      axios.patch(`/api/links/${id}/`, {'url': url},
        {headers: {'Authorization': 'Token ' + localStorage.getItem('token')}})
      .then(response => {
        console.info('Updated link with id:', id)
        context.commit('notify', {'message': 'Updated Link', 'level': 'info'})
        context.commit('updateLinkUrl', id)
        context.commit('setLoadingProgress', 100)
      })
      .catch(error => {
        console.warn('Problem updating link.', error)
        context.commit('notify', {'message': 'Problem updating Link', 'level': 'warning'})
        context.commit('updateLinkUrlErrors', error)
        context.commit('setLoadingProgress', 0)
      })
    },
  },
})

store.watch(() => store.state.loadingprogress, () => nb.go(store.state.loadingprogress))

export default store
