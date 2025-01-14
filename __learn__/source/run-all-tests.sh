#!/bin/bash
#
# Run all tests for the root CDK project + microservices + Lambda functions + dependency source packages (including unit + integration + snapshot tests)

[ "$DEBUG" == "true" ] && set -x
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
    echo "(source/run-all-tests.sh) ERROR: examine output above" 1>&2
    exit 1
  fi
  
  sed -i -e "s,<source>$source_dir,<source>source,g" $coverage_report_path

  deactivate
  
  if ["${CLEAN:-true}" = "true" ]; then
    # Important: further coverage reports processing is possible because we're not deleting $source_dir/test/coverage-reports
    rm -rf $venv_folder coverage .coverage
  fi
}

run_javascript_lambda_test() {
  lambda_name=$1
  echo "[Test] JS Lambda: $lambda_name"

  npm test
  if [ "$?" = "1" ]; then 
    echo "(source/run-all-tests.sh) ERROR: examine output above" 1>&2
    exit 1
  fi

  [ "${CLEAN:-true}" = "true" ] && rm -rf coverage/lcov-report
  mkdir -p $source_dir/test/coverage-reports/jest
  coverage_report_path=$source_dir/test/coverage-reports/jest/$lambda_name
  rm -rf $coverage_report_path
  mv coverage $coverage_report_path
}

run_cdk_project_test() {
  component_description=$1
  component_name=solutions-constructs
  echo "[Test] $component_description"

  [ "${CLEAN:-true}" = "true" ] && npm run clean
  npm ci
  npm run build
  npm run test -- -u

  if [ "$?" = "1" ]; then
    echo "(source/run-all-tests.sh) ERROR: examine output above" 1>&2
    exit
  fi

  [ "${CLEAN:-true}" = "true" ] && rm -rf coverage/lcov-report
  mkdir -p $source_dir/test/coverage-reports/jest
  coverage_report_path=$source_dir/test/coverage-reports/jest/$component_name
  rm -rf $coverage_report_path
  mv coverage $coverage_Report_path
}

# save PWD and set source dir
source_dir=$PWD
cd $source_dir

# indicate whether you want a fresh new test environment before/after the tests are run
# Override the CLEAN environment variable of 'true' by setting to false
# $ CLEAN=false ./run-all-tests.sh
CLEAN="${CLEAN:-true}"

# Test CDK project
run_cdk_project_test "CDK - AWS Streaming Data solution, ya baby!"

# test Lambda functions
cd $source_dir/lambda
for folder in */ ; do
  cd "$folder"
  function_name=${PWD##*/}

  if [ -e "requirements.txt" ]; then
    run_python_lambda_test $function_name
  elif [ -e "package.json" ]; then
    run_javascript_lambda_test $function_name
  fi

  cd ..
done

# return to where we started
cd $source_dir