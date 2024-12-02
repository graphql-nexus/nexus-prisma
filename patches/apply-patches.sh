#!/bin/bash
set -exo pipefail

applied_patches_file=node_modules/.applied-patches

if [ ! -f $applied_patches_file ]; then
  patches_folder=patches

  if [ ! -z $1 ]; then
    patches_folder=$1
  fi

  if [ -d $patches_folder ]; then
    for patch_file in $(ls -A1 $patches_folder/*.patch); do
      patch -p0 -N < $patch_file
    done
  fi

  touch $applied_patches_file
fi

