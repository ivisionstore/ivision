const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app/admin/coupons/page.tsx')
let source = fs.readFileSync(file, 'utf8')

const sectionOpen = '            <section className="rounded-3xl border border-cyan-300/10 bg-[var(--panel)] p-5">\n              <h2 className="font-bold text-lg">\n                Create Campaign\n              </h2>'
const formOpen = '            <form onSubmit={createCampaign} className="rounded-3xl border border-cyan-300/10 bg-[var(--panel)] p-5">\n              <h2 className="font-bold text-lg">\n                Create Campaign\n              </h2>'

if (source.includes(sectionOpen)) {
  source = source.replace(sectionOpen, formOpen)
}

const brokenStart = '              <button\n                type="button"\n                disabled={busy}\n                <form'
const importSection = '\n            <section\n              id="import-codes"'
const start = source.indexOf(brokenStart)
const end = source.indexOf(importSection, start)

if (start !== -1 && end !== -1) {
  const submitButton = `              <button\n                type="submit"\n                disabled={busy}\n                className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 py-3 font-bold"\n              >\n                <Plus\n                  size={17}\n                  className="inline mr-2"\n                />\n                Create campaign\n              </button>\n            </form>\n`
  source = source.slice(0, start) + submitButton + source.slice(end)
}

fs.writeFileSync(file, source)
console.log('Coupon admin build repair applied.')
