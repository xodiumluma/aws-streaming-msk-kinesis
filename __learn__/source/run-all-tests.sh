#!/bin/bash
#
# Run all tests for the root CDK project + microservices + Lambda functions + dependency source packages (including unit + integration + snapshot tests)

[ "$DEBUG" == 'true' ] && set -x
set -e

venv_folder="./v-env/"

setup_python_env() {
  if [ -d "$venv_folder" ]; then
    echo "Reusing Python venv ($venv_folder)"
    return
  fi

  python3 -m venv $venv_folder
  source $venv_folder/bin/activate
  pip3 install -q -r requirements.txt -r requirements-test.txt
  deactivate
}

run_python_lambda_test() {
  lambda_name=$1
  echo "[Test] Python Lambda: $lambda_name"
  [ "${CLEAN:-true}" = "true" ] && rm -rf $venv_folder

  setup_python_env
  source $venv_folder/bin/activate

  mkdir -p $source_dir/test/coverage-reports
  coverage_report_path=$source_dir/test/coverage-reports/$lambda_name.coverage.xml
  echo "Set coverage report path to $coverage_report_path"

  coverage run --omit "*/site-packages/*" -m unittest discover
  coverage xml -o $coverage_report_path
  coverage report --show-missing
  if [ "$?" = "1" ]; then
    echo "(source/run-all-tests.sh) ERROR: check likely output" 1>&2
    exit 1
  fi
  
  sed -i -e "s,<source>$source_dir,<source>source,g" $coverage_report_path

  deactivate
  
  if ["${CLEAN:-true}" = "true" ]; then
    # Important: further coverage reports processing is possible because we're not deleting $source_dir/test/coverage-reports
    rm -rf $venv_folder coverage .coverage
  fi
}
