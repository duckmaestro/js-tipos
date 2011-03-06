/*******************************************************************
 *     js-tipos
 *******************************************************************
  Copyright 2010-2011 Clifford Champion.
  
  This file is part of js-tipos.
  
  js-tipos is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  js-tipos is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  
  You should have received a copy of the GNU General Public License
  along with js-tipos.  If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************/
 
/// <reference path="~/Base/Classer.js" />

$assert = function (expression) { if (expression != true) { throw new Error("Assert failed."); debugger; } };

$tipos(true); // notify bootstrapper that we're ready.
