import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canCompleteRegistration,
  canRoleAccessPath,
  dashboardForRole,
  normaliseAccountRole,
} from '../src/lib/role-access.ts'

test('only authoritative database roles are recognised', () => {
  assert.equal(normaliseAccountRole('candidate'), 'candidate')
  assert.equal(normaliseAccountRole('talent'), 'candidate')
  assert.equal(normaliseAccountRole('employer'), 'employer')
  assert.equal(normaliseAccountRole('admin'), 'admin')
  assert.equal(normaliseAccountRole('owner'), null)
  assert.equal(normaliseAccountRole(undefined), null)
})

test('talent cannot enter employer, hotel or admin paths', () => {
  assert.equal(canRoleAccessPath('candidate', '/talent/dashboard'), true)
  assert.equal(canRoleAccessPath('candidate', '/employer/dashboard'), false)
  assert.equal(canRoleAccessPath('candidate', '/hotel/dashboard'), false)
  assert.equal(canRoleAccessPath('candidate', '/admin/dashboard'), false)
})

test('employer cannot enter talent or admin paths', () => {
  assert.equal(canRoleAccessPath('employer', '/employer/dashboard'), true)
  assert.equal(canRoleAccessPath('employer', '/hotel/jobs'), true)
  assert.equal(canRoleAccessPath('employer', '/talent/dashboard'), false)
  assert.equal(canRoleAccessPath('employer', '/admin/dashboard'), false)
})

test('admin can support each protected area', () => {
  assert.equal(canRoleAccessPath('admin', '/admin/dashboard'), true)
  assert.equal(canRoleAccessPath('admin', '/employer/dashboard'), true)
  assert.equal(canRoleAccessPath('admin', '/hotel/dashboard'), true)
  assert.equal(canRoleAccessPath('admin', '/talent/dashboard'), true)
})

test('role dashboards are deterministic', () => {
  assert.equal(dashboardForRole('candidate'), '/talent/dashboard')
  assert.equal(dashboardForRole('employer'), '/employer/dashboard')
  assert.equal(dashboardForRole('admin'), '/admin/dashboard')
})

test('registration cannot create the opposite account type', () => {
  assert.equal(canCompleteRegistration(null, 'employer'), true)
  assert.equal(canCompleteRegistration('employer', 'employer'), true)
  assert.equal(canCompleteRegistration('candidate', 'employer'), false)
  assert.equal(canCompleteRegistration('candidate', 'talent'), true)
  assert.equal(canCompleteRegistration('employer', 'talent'), false)
  assert.equal(canCompleteRegistration('admin', 'talent'), false)
  assert.equal(canCompleteRegistration('admin', 'employer'), false)
})
