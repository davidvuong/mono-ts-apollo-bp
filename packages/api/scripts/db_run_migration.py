#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import getpass
import copy
import argparse
import subprocess
from logging import getLogger, basicConfig


PROMPT_DATA = [
    {'env': 'DB_HOST', 'default': 'localhost'},
    {'env': 'DB_PORT', 'default': 5432},
    {'env': 'DB_USERNAME', 'default': 'postgres'},
    {'env': 'DB_PASSWORD', 'default': 'password', 'prompt_function': getpass.getpass},
    {'env': 'DB_NAME', 'default': 'monots'},
]

basicConfig()
logger = getLogger(os.path.basename(os.path.dirname(__file__)))
logger.setLevel('INFO')


def execute_migration(environ):
    migration_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../migrations')
    command = [
        'flyway',
        'migrate',
        f'-user={environ["DB_USERNAME"]}',
        f'-password={environ["DB_PASSWORD"]}',
        f'-url=jdbc:postgresql://{environ["DB_HOST"]}:{environ["DB_PORT"]}/{environ["DB_NAME"]}',
        f'-locations=filesystem:{migration_path}',
    ]
    result = subprocess.run(command, text=True)
    if result.stderr:
        logger.error(result.stderr)
    result.check_returncode()


def prompt_user_input(prompt, environ):
    prompt_user = prompt.get('prompt_function', input)
    prompt_message = '%s=? (default: %s): ' % (prompt['env'], prompt['default'])

    user_input = prompt_user(prompt_message)
    user_input = user_input or prompt['default']

    environ[prompt['env']] = str(user_input)
    return environ


def use_default(environ):
    for data in PROMPT_DATA:
        environ[data['env']] = str(data['default'])


def main():
    parser = argparse.ArgumentParser(description='Executes the database migration')
    parser.add_argument('--use-default', action='store_true', help='Use default configuration and avoid prompting user')
    args = parser.parse_args()

    environ = copy.deepcopy(os.environ)

    if args.use_default:
        use_default(environ)
    else:
        for prompt in PROMPT_DATA:
            prompt_user_input(prompt, environ)

    execute_migration(environ)


if __name__ == '__main__':
    main()
