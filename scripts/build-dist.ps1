$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dist = Join-Path $root 'dist'
New-Item -ItemType Directory -Force -Path $dist | Out-Null

$weatherPath = Join-Path $root 'lib\weather.js'
$snowPath = Join-Path $root 'lib\Snow.js'
$stylesPath = Join-Path $root 'lib\assets\style\styles.css'
$cssOut = Join-Path $dist 'snow.min.css'
$jsOut = Join-Path $dist 'Snow.min.js'

$weather = Get-Content -Raw -Encoding UTF8 $weatherPath
$weather = $weather -replace 'export function classifyPrecipitation', 'function classifyPrecipitation'
$weather = $weather -replace 'export async function fetchPrecipitationMode', 'async function fetchPrecipitationMode'

$snow = Get-Content -Raw -Encoding UTF8 $snowPath
$snow = $snow -replace "import \{ fetchPrecipitationMode \} from '\./weather\.js';\r?\n", ''
$snow = $snow -replace 'export default class Snow', 'class Snow'

$umdHeader = "(function (root, factory) {`n"
$umdHeader += "  if (typeof module === 'object' && typeof module.exports === 'object') {`n"
$umdHeader += "    module.exports = factory();`n"
$umdHeader += "  } else if (typeof define === 'function' && define.amd) {`n"
$umdHeader += "    define([], factory);`n"
$umdHeader += "  } else {`n"
$umdHeader += "    root.Snow = factory();`n"
$umdHeader += "  }`n"
$umdHeader += "})(typeof self !== 'undefined' ? self : this, function () {`n"
$umdHeader += "  'use strict';`n"

$umdFooter = "`n  return Snow;`n});`n"

$umd = $umdHeader + $weather + $snow + $umdFooter
[System.IO.File]::WriteAllText($jsOut, $umd, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $jsOut"

if (-not (Test-Path $cssOut)) {
  Copy-Item $stylesPath $cssOut
  Write-Host "Copied styles to $cssOut"
} else {
  $css = Get-Content -Raw -Encoding UTF8 $cssOut
  if ($css -notmatch 'raindrops-box') {
    $rainBlock = '.raindrops-box{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;user-select:none;z-index:9;overflow:hidden}.raindrops-box .raindrop{position:absolute;top:-24px;width:2px;border-radius:1px;animation:rain-fall linear infinite}@keyframes rain-fall{to{transform:translateY(calc(100vh + 24px))}}'
    [System.IO.File]::WriteAllText($cssOut, $rainBlock + $css, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Patched rain CSS"
  }
}

$built = Get-Content -Raw -Encoding UTF8 $jsOut
if ($built -notmatch 'fetchPrecipitationMode') {
  throw 'Build verification failed'
}

Write-Host 'Build OK'
