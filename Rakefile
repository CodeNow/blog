require "rubygems"
require "tmpdir"
require "bundler/setup"
require "jekyll"

GH_PAGES_DIR = "_site"
GITHUB_REPONAME = "CodeNow/blog"

desc "Build Jekyll site for development"
task :serve do
  system "bundle"
  system "bundle exec jekyll serve"
end

desc "Build Jekyll site and copy files"
task :build do
  system "jekyll build"
  system "rm -r ../#{GH_PAGES_DIR}/*" unless Dir['../#{GH_PAGES_DIR}/*'].empty?
  system "cp -r _site/* ../#{GH_PAGES_DIR}/"
end

desc "Generate blog files"
task :generate do
  Jekyll::Site.new(Jekyll.configuration({
    "source"      => ".",
    "destination" => "_site"
  })).process
end

desc "Generate and publish blog to gh-pages"
task :publish => [:generate] do
  Dir.mktmpdir do |tmp|
    cp_r "_site/.", tmp

    pwd = Dir.pwd
    Dir.chdir tmp

    system "git init"
    system "git commit --allow-empty -m 'Blog Updated at #{Time.now.utc}'"
    system "git checkout -b gh-pages"
    system "git add ."
    message = "Site updated at #{Time.now.utc}"
    system "git commit -m #{message.inspect}"
    # system "git remote add origin git@github.com:#{GITHUB_REPONAME}.git"
    system "git push git@github.com:#{GITHUB_REPONAME}.git gh-pages --force"

    Dir.chdir pwd
  end
end
